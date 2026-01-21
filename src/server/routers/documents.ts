import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { DocumentType, ProcessingStatus } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { inngest } from '@/inngest/client'
import { queryOrganizationMemory } from '../services/ai/rag'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export const documentsRouter = router({
  /**
   * List all documents with filters
   */
  list: orgProcedure
    .input(
      z.object({
        type: z.nativeEnum(DocumentType).optional(),
        status: z.nativeEnum(ProcessingStatus).optional(),
        grantId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const documents = await ctx.db.document.findMany({
        where: {
          organizationId: ctx.organizationId,
          ...(input.type && { type: input.type }),
          ...(input.status && { status: input.status }),
          ...(input.grantId && { grantId: input.grantId }),
        },
        orderBy: { createdAt: 'desc' },
        include: {
          grant: {
            select: {
              id: true,
              funder: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

      return documents
    }),

  /**
   * Get single document by ID with metadata
   */
  byId: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const document = await ctx.db.document.findFirst({
        where: {
          id: input.id,
          organizationId: ctx.organizationId,
        },
        include: {
          grant: {
            include: {
              funder: true,
            },
          },
        },
      })

      if (!document) {
        throw new Error('Document not found')
      }

      return document
    }),

  /**
   * Generate presigned S3 URL for document upload
   */
  createUploadUrl: orgProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        documentType: z.nativeEnum(DocumentType),
        grantId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate unique S3 key
      const timestamp = Date.now()
      const sanitizedFileName = input.fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const s3Key = `${ctx.organizationId}/${timestamp}-${sanitizedFileName}`

      // Create document record
      const document = await ctx.db.document.create({
        data: {
          organizationId: ctx.organizationId,
          grantId: input.grantId,
          name: input.fileName,
          type: input.documentType,
          mimeType: input.fileType,
          size: input.fileSize,
          s3Key,
          status: ProcessingStatus.PENDING,
        },
      })

      // Generate presigned URL
      const command = new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET!,
        Key: s3Key,
        ContentType: input.fileType,
      })

      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600, // 1 hour
      })

      return {
        documentId: document.id,
        uploadUrl,
        s3Key,
      }
    }),

  /**
   * Confirm upload and trigger processing
   */
  confirmUpload: orgProcedure
    .input(
      z.object({
        documentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get document details first
      const doc = await ctx.db.document.findFirst({
        where: {
          id: input.documentId,
          organizationId: ctx.organizationId,
        },
      })

      if (!doc) {
        throw new Error('Document not found or access denied')
      }

      // Update status to PROCESSING
      await ctx.db.document.update({
        where: {
          id: input.documentId,
        },
        data: {
          status: ProcessingStatus.PROCESSING,
        },
      })

      // Trigger Inngest document processing job
      await inngest.send({
        name: 'document/uploaded',
        data: {
          documentId: doc.id,
          organizationId: doc.organizationId,
          s3Key: doc.s3Key,
          mimeType: doc.mimeType,
        },
      })

      return ctx.db.document.findUnique({
        where: { id: input.documentId },
      })
    }),

  /**
   * Update document processing status
   */
  updateStatus: orgProcedure
    .input(
      z.object({
        documentId: z.string(),
        status: z.nativeEnum(ProcessingStatus),
        confidenceScore: z.number().min(0).max(100).optional(),
        parseWarnings: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { documentId, ...data } = input

      const document = await ctx.db.document.updateMany({
        where: {
          id: documentId,
          organizationId: ctx.organizationId,
        },
        data: {
          ...data,
          processedAt:
            data.status === ProcessingStatus.COMPLETED ||
            data.status === ProcessingStatus.NEEDS_REVIEW
              ? new Date()
              : undefined,
        },
      })

      if (document.count === 0) {
        throw new Error('Document not found or access denied')
      }

      return ctx.db.document.findUnique({
        where: { id: documentId },
      })
    }),

  /**
   * Get document health statistics
   */
  health: orgProcedure.query(async ({ ctx }) => {
    const [completed, processing, needsReview, failed] = await Promise.all([
      ctx.db.document.count({
        where: {
          organizationId: ctx.organizationId,
          status: ProcessingStatus.COMPLETED,
        },
      }),
      ctx.db.document.count({
        where: {
          organizationId: ctx.organizationId,
          status: ProcessingStatus.PROCESSING,
        },
      }),
      ctx.db.document.count({
        where: {
          organizationId: ctx.organizationId,
          status: ProcessingStatus.NEEDS_REVIEW,
        },
      }),
      ctx.db.document.count({
        where: {
          organizationId: ctx.organizationId,
          status: ProcessingStatus.FAILED,
        },
      }),
    ])

    return {
      completed,
      processing,
      needsReview,
      failed,
      total: completed + processing + needsReview + failed,
    }
  }),

  /**
   * Approve a document that needs review
   */
  approveDocument: orgProcedure
    .input(
      z.object({
        documentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.db.document.updateMany({
        where: {
          id: input.documentId,
          organizationId: ctx.organizationId,
          status: ProcessingStatus.NEEDS_REVIEW,
        },
        data: {
          status: ProcessingStatus.COMPLETED,
        },
      })

      if (document.count === 0) {
        throw new Error('Document not found or not in NEEDS_REVIEW status')
      }

      return ctx.db.document.findUnique({
        where: { id: input.documentId },
      })
    }),

  /**
   * Get detailed health statistics based on confidence scores
   */
  getHealthStats: orgProcedure.query(async ({ ctx }) => {
    const documents = await ctx.db.document.findMany({
      where: {
        organizationId: ctx.organizationId,
      },
      select: {
        id: true,
        status: true,
        confidenceScore: true,
      },
    })

    const total = documents.length
    let successful = 0
    let needsReview = 0
    let failed = 0
    let processing = 0

    documents.forEach((doc) => {
      if (doc.status === ProcessingStatus.PROCESSING || doc.status === ProcessingStatus.PENDING) {
        processing++
      } else if (doc.status === ProcessingStatus.FAILED) {
        failed++
      } else if (doc.status === ProcessingStatus.NEEDS_REVIEW) {
        needsReview++
      } else if (doc.status === ProcessingStatus.COMPLETED) {
        const score = doc.confidenceScore || 0
        if (score >= 80) {
          successful++
        } else if (score >= 60) {
          needsReview++
        } else {
          failed++
        }
      }
    })

    // Calculate overall health score (0-100)
    const healthScore = total > 0 ? Math.round((successful / total) * 100) : 100

    return {
      total,
      successful,
      needsReview,
      failed,
      processing,
      healthScore,
    }
  }),

  /**
   * Get documents by health status
   */
  getDocumentsByHealth: orgProcedure
    .input(
      z.object({
        filter: z.enum(['all', 'successful', 'needs-review', 'failed']).default('all'),
      })
    )
    .query(async ({ ctx, input }) => {
      const baseWhere = {
        organizationId: ctx.organizationId,
      }

      let where: any = { ...baseWhere }

      if (input.filter === 'successful') {
        where.OR = [
          {
            status: ProcessingStatus.COMPLETED,
            confidenceScore: { gte: 80 },
          },
        ]
      } else if (input.filter === 'needs-review') {
        where.OR = [
          {
            status: ProcessingStatus.NEEDS_REVIEW,
          },
          {
            status: ProcessingStatus.COMPLETED,
            confidenceScore: { gte: 60, lt: 80 },
          },
        ]
      } else if (input.filter === 'failed') {
        where.OR = [
          {
            status: ProcessingStatus.FAILED,
          },
          {
            status: ProcessingStatus.COMPLETED,
            confidenceScore: { lt: 60 },
          },
        ]
      }

      const documents = await ctx.db.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          grant: {
            select: {
              id: true,
              funder: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      })

      // Parse issues from parseWarnings
      return documents.map((doc) => {
        const issues: any[] = []

        if (doc.parseWarnings) {
          try {
            const warnings = Array.isArray(doc.parseWarnings)
              ? doc.parseWarnings
              : typeof doc.parseWarnings === 'object' && doc.parseWarnings !== null
              ? [doc.parseWarnings]
              : []

            warnings.forEach((warning: any) => {
              if (typeof warning === 'string') {
                issues.push({
                  type: 'parsing',
                  severity: 'medium',
                  message: warning,
                })
              } else if (typeof warning === 'object') {
                issues.push({
                  type: warning.type || 'parsing',
                  severity: warning.severity || 'medium',
                  message: warning.message || String(warning),
                  pageNumbers: warning.pageNumbers,
                })
              }
            })
          } catch (error) {
            console.error('Error parsing warnings:', error)
          }
        }

        // Add generic issues based on confidence score
        const score = doc.confidenceScore || 0
        if (score < 60 && doc.status === ProcessingStatus.COMPLETED) {
          issues.push({
            type: 'quality',
            severity: 'high',
            message: 'Very low confidence score. Manual verification required.',
          })
        } else if (score < 80 && doc.status === ProcessingStatus.COMPLETED) {
          issues.push({
            type: 'quality',
            severity: 'medium',
            message: 'Medium confidence score. Review recommended.',
          })
        }

        return {
          ...doc,
          issues,
        }
      })
    }),

  /**
   * Update document corrections
   */
  updateDocumentCorrections: orgProcedure
    .input(
      z.object({
        documentId: z.string(),
        extractedText: z.string().optional(),
        metadata: z.any().optional(),
        confidenceScore: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { documentId, ...updates } = input

      const document = await ctx.db.document.updateMany({
        where: {
          id: documentId,
          organizationId: ctx.organizationId,
        },
        data: {
          ...updates,
          status: ProcessingStatus.COMPLETED,
        },
      })

      if (document.count === 0) {
        throw new Error('Document not found or access denied')
      }

      return ctx.db.document.findUnique({
        where: { id: documentId },
      })
    }),

  /**
   * Reprocess a failed document
   */
  reprocessDocument: orgProcedure
    .input(
      z.object({
        documentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.db.document.findFirst({
        where: {
          id: input.documentId,
          organizationId: ctx.organizationId,
        },
      })

      if (!doc) {
        throw new Error('Document not found or access denied')
      }

      // Update status to PROCESSING
      await ctx.db.document.update({
        where: {
          id: input.documentId,
        },
        data: {
          status: ProcessingStatus.PROCESSING,
          confidenceScore: null,
          parseWarnings: null,
        },
      })

      // Trigger Inngest document processing job
      await inngest.send({
        name: 'document/uploaded',
        data: {
          documentId: doc.id,
          organizationId: doc.organizationId,
          s3Key: doc.s3Key,
          mimeType: doc.mimeType,
        },
      })

      return ctx.db.document.findUnique({
        where: { id: input.documentId },
      })
    }),

  /**
   * Delete a document
   */
  deleteDocument: orgProcedure
    .input(
      z.object({
        documentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const document = await ctx.db.document.deleteMany({
        where: {
          id: input.documentId,
          organizationId: ctx.organizationId,
        },
      })

      if (document.count === 0) {
        throw new Error('Document not found or access denied')
      }

      return { success: true }
    }),

  /**
   * Semantic search across organization documents
   */
  search: orgProcedure
    .input(
      z.object({
        query: z.string().min(1, 'Query cannot be empty'),
        type: z.nativeEnum(DocumentType).optional(),
        limit: z.number().min(1).max(50).optional().default(10),
        minScore: z.number().min(0).max(1).optional().default(0.7),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, type, limit, minScore } = input

      try {
        // Query organization memory using RAG
        const contexts = await queryOrganizationMemory({
          query,
          organizationId: ctx.organizationId,
          topK: limit,
          minScore,
        })

        // Group contexts by document
        const documentMap = new Map<string, {
          document: any
          chunks: Array<{ text: string; score: number; chunkIndex: number }>
          maxScore: number
        }>()

        for (const context of contexts) {
          if (!documentMap.has(context.documentId)) {
            // Fetch document details
            const document = await ctx.db.document.findFirst({
              where: {
                id: context.documentId,
                organizationId: ctx.organizationId,
                ...(type && { type }),
              },
              include: {
                grant: {
                  select: {
                    id: true,
                    funder: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            })

            if (document) {
              documentMap.set(context.documentId, {
                document,
                chunks: [],
                maxScore: 0,
              })
            }
          }

          const docData = documentMap.get(context.documentId)
          if (docData) {
            docData.chunks.push({
              text: context.text,
              score: context.score,
              chunkIndex: context.chunkIndex,
            })
            docData.maxScore = Math.max(docData.maxScore, context.score)
          }
        }

        // Convert to array and sort by relevance
        const results = Array.from(documentMap.values())
          .sort((a, b) => b.maxScore - a.maxScore)
          .map(({ document, chunks, maxScore }) => ({
            document,
            relevanceScore: Math.round(maxScore * 100),
            matchingChunks: chunks.sort((a, b) => b.score - a.score).slice(0, 3), // Top 3 chunks per document
          }))

        return {
          results,
          totalDocuments: results.length,
          totalChunks: contexts.length,
        }
      } catch (error) {
        console.error('Search error:', error)
        // If search fails (e.g., Pinecone not configured), return empty results
        return {
          results: [],
          totalDocuments: 0,
          totalChunks: 0,
          error: error instanceof Error ? error.message : 'Search failed',
        }
      }
    }),
})
