import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { queryOrganizationMemory } from '../services/ai/rag'
import { generateEmbedding } from '../services/ai/embeddings'
import { anthropic } from '@/lib/anthropic'
import { TRPCError } from '@trpc/server'

/**
 * Writing Studio Router
 * Implements V3 Trust Architecture with source attribution requirements
 */
export const writingRouter = router({
  /**
   * Search organizational memory for relevant content
   * Used in Writing Studio's memory search widget
   */
  searchMemory: orgProcedure
    .input(
      z.object({
        query: z.string().min(1, 'Query cannot be empty'),
        organizationId: z.string(),
        limit: z.number().min(1).max(50).optional().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log(`[writing.searchMemory] Searching for: "${input.query.slice(0, 50)}..."`)

        // Query Pinecone with organization namespace
        const contexts = await queryOrganizationMemory({
          query: input.query,
          organizationId: input.organizationId,
          topK: input.limit,
          minScore: 0.7,
        })

        // Format results for Writing Studio
        const results = contexts.map((ctx) => ({
          documentId: ctx.documentId,
          documentName: ctx.documentName,
          text: ctx.text,
          score: Math.round(ctx.score * 100) / 100, // Round to 2 decimals
        }))

        console.log(`[writing.searchMemory] Found ${results.length} relevant chunks`)

        return { results }
      } catch (error) {
        console.error('[writing.searchMemory] Error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Memory search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Generate draft content with V3 Trust Architecture
   * CRITICAL: Only generates if confidence >= 60%
   * Always includes source attribution
   */
  generateDraft: orgProcedure
    .input(
      z.object({
        grantId: z.string(),
        sectionName: z.string(),
        prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
        mode: z.enum(['memory_assist', 'ai_draft', 'human_first']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[writing.generateDraft] Starting generation:', {
          grantId: input.grantId,
          sectionName: input.sectionName,
          mode: input.mode,
        })

        // Verify grant access
        const grant = await ctx.db.grant.findFirst({
          where: {
            id: input.grantId,
            organizationId: ctx.organizationId,
          },
        })

        if (!grant) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Grant not found or access denied',
          })
        }

        // Step 1: Fetch relevant context from Pinecone (top 10 chunks)
        const contexts = await queryOrganizationMemory({
          query: input.prompt,
          organizationId: ctx.organizationId,
          topK: 10,
          minScore: 0.7,
        })

        console.log(`[writing.generateDraft] Found ${contexts.length} relevant contexts`)

        // Step 2: Calculate confidence score from average retrieval scores
        const averageScore =
          contexts.length > 0
            ? contexts.reduce((sum, ctx) => sum + ctx.score, 0) / contexts.length
            : 0

        // Confidence formula: weighted scoring
        // - Context quantity: up to 40 points (10 contexts = full 40)
        // - Average relevance: up to 60 points (1.0 score = full 60)
        const contextQuantityScore = Math.min((contexts.length / 10) * 40, 40)
        const relevanceScore = averageScore * 60
        const confidenceScore = Math.round(contextQuantityScore + relevanceScore)

        console.log('[writing.generateDraft] Confidence calculation:', {
          contextsFound: contexts.length,
          averageScore: averageScore.toFixed(3),
          contextQuantityScore,
          relevanceScore,
          confidenceScore,
        })

        // Step 3: V3 Trust Architecture - Check confidence threshold
        if (confidenceScore < 60) {
          console.log('[writing.generateDraft] Confidence below threshold - returning sources only')

          return {
            shouldGenerate: false,
            content: null,
            confidence: confidenceScore,
            sources: contexts.map((ctx) => ({
              documentId: ctx.documentId,
              documentName: ctx.documentName,
              text: ctx.text.slice(0, 500), // Preview only
              score: Math.round(ctx.score * 100),
              chunkIndex: ctx.chunkIndex,
            })),
            message: `Cannot confidently generate content (confidence: ${confidenceScore}%). Here are relevant sources for manual review.`,
          }
        }

        // Step 4: Build context string for Claude
        const contextString = contexts
          .map(
            (ctx, idx) =>
              `<source id="${idx + 1}" document="${ctx.documentName}" relevance="${Math.round(ctx.score * 100)}%">
${ctx.text}
</source>`
          )
          .join('\n\n')

        // Step 5: Build system prompt based on mode
        const systemPrompt = buildSystemPrompt(input.mode, input.sectionName, contexts.length)

        // Step 6: Build user message
        const userMessage = `# Organizational Context

${contextString}

# Task

${input.prompt}

# Section

You are writing the "${input.sectionName}" section of a grant proposal.`

        // Step 7: Call Claude API
        console.log('[writing.generateDraft] Calling Claude API...')
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          temperature: 0.7,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userMessage,
            },
          ],
        })

        // Step 8: Extract content from response
        const content = response.content[0].type === 'text' ? response.content[0].text : ''

        console.log('[writing.generateDraft] Generation successful:', {
          confidence: confidenceScore,
          sourcesUsed: contexts.length,
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        })

        // Step 9: Return success response with sources
        return {
          shouldGenerate: true,
          content,
          confidence: confidenceScore,
          sources: contexts.map((ctx) => ({
            documentId: ctx.documentId,
            documentName: ctx.documentName,
            text: ctx.text.slice(0, 500), // Preview
            score: Math.round(ctx.score * 100),
            chunkIndex: ctx.chunkIndex,
          })),
          message: `Content generated with ${confidenceScore}% confidence based on ${contexts.length} relevant sources.`,
        }
      } catch (error) {
        console.error('[writing.generateDraft] Error:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Draft generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Save draft content to grant
   * Tracks AI involvement for audit mode
   */
  saveContent: orgProcedure
    .input(
      z.object({
        grantId: z.string(),
        sectionName: z.string(),
        content: z.string(),
        isAiGenerated: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[writing.saveContent] Saving content:', {
          grantId: input.grantId,
          sectionName: input.sectionName,
          isAiGenerated: input.isAiGenerated,
          contentLength: input.content.length,
        })

        // Verify grant access
        const grant = await ctx.db.grant.findFirst({
          where: {
            id: input.grantId,
            organizationId: ctx.organizationId,
          },
        })

        if (!grant) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Grant not found or access denied',
          })
        }

        // Get existing notes (using notes field as draft content storage)
        // In a real implementation, you'd add a dedicated draftContent JSON field to the Grant model
        const existingDraft = grant.notes ? JSON.parse(grant.notes) : {}

        // Update draft content
        const updatedDraft = {
          ...existingDraft,
          sections: {
            ...(existingDraft.sections || {}),
            [input.sectionName]: {
              content: input.content,
              isAiGenerated: input.isAiGenerated,
              lastModified: new Date().toISOString(),
            },
          },
        }

        // Save to database
        await ctx.db.grant.update({
          where: { id: input.grantId },
          data: {
            notes: JSON.stringify(updatedDraft),
          },
        })

        console.log('[writing.saveContent] Content saved successfully')

        return {
          success: true,
          message: 'Draft content saved',
        }
      } catch (error) {
        console.error('[writing.saveContent] Error:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to save content: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Get saved draft content for a grant
   * Returns all sections with AI generation audit trail
   */
  getGrantDraft: orgProcedure
    .input(
      z.object({
        grantId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        console.log('[writing.getGrantDraft] Fetching draft for grant:', input.grantId)

        // Verify grant access
        const grant = await ctx.db.grant.findFirst({
          where: {
            id: input.grantId,
            organizationId: ctx.organizationId,
          },
        })

        if (!grant) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Grant not found or access denied',
          })
        }

        // Parse draft content from notes field
        const draftData = grant.notes ? JSON.parse(grant.notes) : { sections: {} }

        console.log('[writing.getGrantDraft] Found sections:', Object.keys(draftData.sections || {}).length)

        return {
          grantId: input.grantId,
          sections: draftData.sections || {},
        }
      } catch (error) {
        console.error('[writing.getGrantDraft] Error:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        // If JSON parsing fails, return empty draft
        if (error instanceof SyntaxError) {
          return {
            grantId: input.grantId,
            sections: {},
          }
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch draft: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),
})

/**
 * Build system prompt based on generation mode
 */
function buildSystemPrompt(
  mode: 'memory_assist' | 'ai_draft' | 'human_first',
  sectionName: string,
  contextsFound: number
): string {
  const basePrompt = `You are an expert grant writer helping a nonprofit organization create compelling proposal content.

You are writing the "${sectionName}" section of a grant proposal.

You have access to ${contextsFound} relevant documents from the organization's memory. Use this information to ground your writing in the organization's actual work, mission, and past achievements.

Mode: ${mode === 'memory_assist' ? 'Memory Assist - Help the writer by suggesting content based on organizational memory' : mode === 'ai_draft' ? 'AI Draft - Generate a complete draft based on organizational memory' : 'Human First - Provide minimal assistance, letting the human writer take the lead'}

Guidelines:
- Write in a clear, professional, and compelling style
- Use specific details from the organizational context
- Ground all claims in evidence from the provided sources
- Match the tone and style typical of grant proposals
- Do not make up information not present in the context
- If information is missing, acknowledge it rather than fabricating
- Always cite sources by referencing the source document name

CRITICAL: All generated content MUST include source attribution. Reference specific documents when making claims.

Output only the requested content without preamble or meta-commentary.`

  return basePrompt
}
