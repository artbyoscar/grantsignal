import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { queryOrganizationMemory } from '../services/ai/rag'
import { generateEmbedding } from '../services/ai/embeddings'
import { anthropic } from '@/lib/anthropic'
import { TRPCError } from '@trpc/server'
import { logActivity, ActivityActions } from '@/lib/activity-logger'
import { extractCommitmentsFromText } from '../services/compliance/commitment-extractor'

/**
 * Writing Studio Router
 * Implements V3 Trust Architecture with source attribution requirements
 */
export const writingRouter = router({
  /**
   * Get grant details for writing context
   * Includes funder, opportunity, and related documents
   */
  getGrantForWriting: orgProcedure
    .input(
      z.object({
        grantId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {

        const grant = await ctx.db.grant.findFirst({
          where: {
            id: input.grantId,
            organizationId: ctx.organizationId,
          },
          include: {
            funder: true,
            opportunity: true,
            program: true,
            documents: {
              where: {
                status: 'COMPLETED',
              },
              select: {
                id: true,
                name: true,
                type: true,
                createdAt: true,
              },
            },
          },
        })

        if (!grant) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Grant not found or access denied',
          })
        }


        return grant
      } catch (error) {
        console.error('[writing.getGrantForWriting] Error:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch grant: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Get RFP sections with word limits
   * Returns parsed sections if available, otherwise returns default structure
   */
  getRFPSections: orgProcedure
    .input(
      z.object({
        grantId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {

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

        // Check if RFP has been parsed and stored in draftContent
        const draftContent = grant.draftContent as any
        if (draftContent?.rfpSections) {
          return draftContent.rfpSections
        }

        // Return default sections if no RFP parsed yet
        const defaultSections = [
          {
            id: 'executive_summary',
            name: 'Executive Summary',
            wordLimit: 500,
            description: 'Brief overview of the proposal',
          },
          {
            id: 'statement_of_need',
            name: 'Statement of Need',
            wordLimit: 1000,
            description: 'Description of the problem or need being addressed',
          },
          {
            id: 'goals_objectives',
            name: 'Goals & Objectives',
            wordLimit: 750,
            description: 'Project goals and measurable objectives',
          },
          {
            id: 'methodology',
            name: 'Methodology',
            wordLimit: 1500,
            description: 'Detailed description of project activities and approach',
          },
          {
            id: 'evaluation_plan',
            name: 'Evaluation Plan',
            wordLimit: 500,
            description: 'How project success will be measured and evaluated',
          },
          {
            id: 'budget_narrative',
            name: 'Budget Narrative',
            wordLimit: 500,
            description: 'Justification for budget items',
          },
        ]

        return defaultSections
      } catch (error) {
        console.error('[writing.getRFPSections] Error:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch RFP sections: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

  /**
   * Get funder intelligence data
   * Returns focus areas, average grant size, and priorities
   */
  getFunderIntelligence: orgProcedure
    .input(
      z.object({
        funderId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {

        const funder = await ctx.db.funder.findUnique({
          where: {
            id: input.funderId,
          },
          include: {
            pastGrantees: {
              take: 10,
              orderBy: {
                year: 'desc',
              },
            },
          },
        })

        if (!funder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Funder not found',
          })
        }

        // Calculate average grant size from past grantees
        const avgGrantSize = funder.pastGrantees.length > 0
          ? funder.pastGrantees.reduce((sum, g) => sum + Number(g.amount), 0) / funder.pastGrantees.length
          : funder.grantSizeMedian ? Number(funder.grantSizeMedian) : null

        // Extract focus areas from programAreas JSON
        const focusAreas = (funder.programAreas as any)?.areas || []

        // Build priorities from available data
        const priorities = {
          programAreas: focusAreas,
          geographicFocus: funder.geographicFocus,
          grantSizeRange: {
            min: funder.grantSizeMin ? Number(funder.grantSizeMin) : null,
            max: funder.grantSizeMax ? Number(funder.grantSizeMax) : null,
            median: funder.grantSizeMedian ? Number(funder.grantSizeMedian) : null,
          },
          applicationProcess: funder.applicationProcess,
          recentGrants: funder.pastGrantees.map(g => ({
            recipient: g.recipientName,
            amount: Number(g.amount),
            purpose: g.purpose,
            year: g.year,
          })),
        }


        return {
          id: funder.id,
          name: funder.name,
          type: funder.type,
          mission: funder.mission,
          focusAreas,
          avgGrantSize,
          totalGiving: funder.totalGiving ? Number(funder.totalGiving) : null,
          priorities,
        }
      } catch (error) {
        console.error('[writing.getFunderIntelligence] Error:', error)

        if (error instanceof TRPCError) {
          throw error
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch funder intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
      }
    }),

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

        // Step 3: V3 Trust Architecture - Check confidence threshold
        if (confidenceScore < 60) {

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

        // Step 9: Log AI content generation
        logActivity({
          organizationId: ctx.organizationId,
          userId: ctx.auth.userId,
          action: ActivityActions.AI_CONTENT_GENERATED,
          entityType: 'grant',
          entityId: input.grantId,
          description: `Generated AI draft for "${input.sectionName}" (${confidenceScore}% confidence)`,
          metadata: { sectionName: input.sectionName, mode: input.mode, confidence: confidenceScore, sourcesUsed: contexts.length },
        })

        // Step 10: Return success response with sources
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

        logActivity({
          organizationId: ctx.organizationId,
          userId: ctx.auth.userId,
          action: ActivityActions.DRAFT_SAVED,
          entityType: 'grant',
          entityId: input.grantId,
          description: `Saved draft for "${input.sectionName}"${input.isAiGenerated ? ' (AI-generated)' : ''}`,
          metadata: { sectionName: input.sectionName, isAiGenerated: input.isAiGenerated, contentLength: input.content.length },
        })

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

  /**
   * Grant Writer Wizard - Writing Readiness Check
   * Assesses what context is available before a user starts writing
   */
  getWritingReadiness: orgProcedure
    .input(z.object({ grantId: z.string() }))
    .query(async ({ ctx, input }) => {
      const grant = await ctx.db.grant.findFirst({
        where: {
          id: input.grantId,
          organizationId: ctx.organizationId,
        },
        include: {
          funder: true,
          opportunity: true,
          program: true,
          documents: {
            where: { status: 'COMPLETED' },
            select: { id: true, name: true, type: true },
          },
        },
      })

      if (!grant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grant not found' })
      }

      // Check organization context
      const org = await ctx.db.organization.findUnique({
        where: { id: ctx.organizationId },
        select: {
          name: true,
          mission: true,
          voiceProfile: true,
          primaryProgramAreas: true,
        },
      })

      // Count available memory documents
      const totalDocs = await ctx.db.document.count({
        where: { organizationId: ctx.organizationId, status: 'COMPLETED' },
      })

      // Check existing draft progress
      const draftContent = (grant.draftContent as Record<string, { content?: string; wordCount?: number }>) || {}
      const sectionsStarted = Object.keys(draftContent).filter(
        k => draftContent[k]?.content && draftContent[k].content!.trim().length > 0
      ).length

      // Check RFP sections availability
      const dc = grant.draftContent as any
      const hasCustomRfpSections = !!dc?.rfpSections

      // Build readiness checklist
      const checks = {
        hasGrant: true,
        hasFunder: !!grant.funder,
        hasOpportunity: !!grant.opportunity,
        hasDeadline: !!grant.deadline,
        hasAmountRequested: !!grant.amountRequested,
        hasDocuments: (grant.documents?.length ?? 0) > 0,
        hasOrgMemory: totalDocs >= 3,
        hasVoiceProfile: !!org?.voiceProfile,
        hasMission: !!org?.mission,
        hasCustomRfpSections,
        hasDraftProgress: sectionsStarted > 0,
      }

      const readyCount = Object.values(checks).filter(Boolean).length
      const totalChecks = Object.keys(checks).length
      const readinessScore = Math.round((readyCount / totalChecks) * 100)

      return {
        grant: {
          id: grant.id,
          status: grant.status,
          funderName: grant.funder?.name || null,
          opportunityTitle: grant.opportunity?.title || null,
          deadline: grant.deadline,
          amountRequested: grant.amountRequested ? Number(grant.amountRequested) : null,
        },
        checks,
        readinessScore,
        sectionsStarted,
        totalDocuments: grant.documents?.length ?? 0,
        orgMemoryDocuments: totalDocs,
        hasVoiceProfile: !!org?.voiceProfile,
        hasCustomRfpSections,
      }
    }),

  /**
   * Real-time Compliance Check
   * Analyzes draft content for commitments and cross-references existing commitments
   * to detect potential conflicts BEFORE submission
   */
  checkCompliance: orgProcedure
    .input(
      z.object({
        grantId: z.string(),
        content: z.string().min(50, 'Content must be at least 50 characters for compliance analysis'),
        sectionName: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify grant access
      const grant = await ctx.db.grant.findFirst({
        where: {
          id: input.grantId,
          organizationId: ctx.organizationId,
        },
        include: {
          funder: { select: { name: true } },
        },
      })

      if (!grant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Grant not found' })
      }

      // Step 1: Extract commitments from the draft text
      const draftCommitments = await extractCommitmentsFromText(
        input.content,
        input.grantId,
        ctx.organizationId
      )

      // Step 2: Fetch existing commitments across all grants for this org
      const existingCommitments = await ctx.db.commitment.findMany({
        where: {
          organizationId: ctx.organizationId,
          grant: {
            status: { in: ['WRITING', 'REVIEW', 'SUBMITTED', 'PENDING', 'AWARDED', 'ACTIVE'] },
          },
        },
        include: {
          grant: {
            select: { id: true, funder: { select: { name: true } } },
          },
        },
      })

      // Step 3: Cross-reference for potential conflicts
      const warnings: Array<{
        type: 'metric_mismatch' | 'capacity_risk' | 'timeline_conflict' | 'duplicate_commitment'
        severity: 'info' | 'warning' | 'critical'
        message: string
        draftCommitment: string
        existingCommitment?: string
        existingGrant?: string
        existingFunder?: string
      }> = []

      for (const draft of draftCommitments) {
        if (!draft.metricName || !draft.metricValue) continue

        // Check for metric mismatches with existing commitments
        for (const existing of existingCommitments) {
          if (!existing.metricName || !existing.metricValue) continue

          // Skip same grant
          if (existing.grantId === input.grantId) continue

          // Check if metric names are similar
          const draftMetric = draft.metricName.toLowerCase().trim()
          const existingMetric = existing.metricName.toLowerCase().trim()

          if (draftMetric === existingMetric || draftMetric.includes(existingMetric) || existingMetric.includes(draftMetric)) {
            // Same metric, different values
            if (draft.metricValue !== existing.metricValue) {
              const draftNum = parseFloat(draft.metricValue)
              const existingNum = parseFloat(existing.metricValue)

              let severity: 'info' | 'warning' | 'critical' = 'warning'
              if (!isNaN(draftNum) && !isNaN(existingNum)) {
                const variance = Math.abs(draftNum - existingNum) / Math.max(draftNum, existingNum)
                severity = variance > 0.25 ? 'critical' : variance > 0.1 ? 'warning' : 'info'
              }

              warnings.push({
                type: 'metric_mismatch',
                severity,
                message: `You are committing to "${draft.metricName}: ${draft.metricValue}" but another grant promises "${existing.metricName}: ${existing.metricValue}" to ${existing.grant.funder?.name || 'another funder'}.`,
                draftCommitment: draft.description,
                existingCommitment: existing.description,
                existingGrant: existing.grantId,
                existingFunder: existing.grant.funder?.name || undefined,
              })
            }
          }
        }

        // Check for capacity overcommit (staffing)
        if (draft.type === 'STAFFING' && draft.metricValue) {
          const draftFTE = parseFloat(draft.metricValue)
          if (!isNaN(draftFTE)) {
            const existingFTE = existingCommitments
              .filter(c => c.type === 'STAFFING')
              .reduce((sum, c) => {
                const match = c.metricValue?.match(/(\d+\.?\d*)/)
                return sum + (match ? parseFloat(match[1]) : 0)
              }, 0)

            if (existingFTE + draftFTE > 10) {
              warnings.push({
                type: 'capacity_risk',
                severity: existingFTE + draftFTE > 20 ? 'critical' : 'warning',
                message: `Adding ${draftFTE} FTE would bring total staffing commitments to ${(existingFTE + draftFTE).toFixed(1)} FTE across all grants. This may exceed organizational capacity.`,
                draftCommitment: draft.description,
              })
            }
          }
        }

        // Check for timeline conflicts
        if (draft.type === 'DELIVERABLE' && draft.dueDate) {
          const draftDate = new Date(draft.dueDate)
          for (const existing of existingCommitments) {
            if (existing.type !== 'DELIVERABLE' || !existing.dueDate) continue
            if (existing.grantId === input.grantId) continue

            // Similar deliverable name check
            const draftDesc = draft.description.toLowerCase().slice(0, 50)
            const existingDesc = existing.description.toLowerCase().slice(0, 50)

            if (draftDesc.includes(existingDesc.slice(0, 20)) || existingDesc.includes(draftDesc.slice(0, 20))) {
              const daysDiff = Math.abs(draftDate.getTime() - existing.dueDate.getTime()) / (1000 * 60 * 60 * 24)
              if (daysDiff > 30) {
                warnings.push({
                  type: 'timeline_conflict',
                  severity: daysDiff > 90 ? 'warning' : 'info',
                  message: `Similar deliverable due ${draftDate.toLocaleDateString()} in this draft but due ${existing.dueDate.toLocaleDateString()} for ${existing.grant.funder?.name || 'another funder'} (${Math.round(daysDiff)} days apart).`,
                  draftCommitment: draft.description,
                  existingCommitment: existing.description,
                  existingGrant: existing.grantId,
                  existingFunder: existing.grant.funder?.name || undefined,
                })
              }
            }
          }
        }
      }

      // Step 4: Build summary
      const criticalCount = warnings.filter(w => w.severity === 'critical').length
      const warningCount = warnings.filter(w => w.severity === 'warning').length
      const infoCount = warnings.filter(w => w.severity === 'info').length

      return {
        commitments: draftCommitments.map(c => ({
          type: c.type,
          description: c.description,
          metricName: c.metricName || null,
          metricValue: c.metricValue || null,
          dueDate: c.dueDate || null,
          confidence: c.confidence,
          sourceText: c.sourceText,
        })),
        warnings,
        summary: {
          commitmentsFound: draftCommitments.length,
          existingCommitmentsChecked: existingCommitments.length,
          criticalIssues: criticalCount,
          warnings: warningCount,
          informational: infoCount,
          overallStatus: criticalCount > 0
            ? 'critical' as const
            : warningCount > 0
              ? 'warning' as const
              : 'clean' as const,
          message: criticalCount > 0
            ? `${criticalCount} critical compliance issue${criticalCount > 1 ? 's' : ''} detected. Review before submitting.`
            : warningCount > 0
              ? `${warningCount} potential consistency issue${warningCount > 1 ? 's' : ''} found across your grants.`
              : draftCommitments.length > 0
                ? `${draftCommitments.length} commitment${draftCommitments.length > 1 ? 's' : ''} detected. No conflicts with existing grants.`
                : 'No specific commitments detected in this section.',
        },
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
