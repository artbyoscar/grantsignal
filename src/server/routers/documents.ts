import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import { DocumentType, ProcessingStatus } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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
      const documents = await ctx.prisma.document.findMany({
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
      const document = await ctx.prisma.document.findFirst({
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
      const document = await ctx.prisma.document.create({
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
      const document = await ctx.prisma.document.updateMany({
        where: {
          id: input.documentId,
          organizationId: ctx.organizationId,
        },
        data: {
          status: ProcessingStatus.PROCESSING,
        },
      })

      if (document.count === 0) {
        throw new Error('Document not found or access denied')
      }

      // TODO: Trigger document processing job (Inngest/background job)
      // This would typically:
      // 1. Extract text from document
      // 2. Parse for commitments
      // 3. Generate embeddings
      // 4. Store in Pinecone
      // 5. Update status to COMPLETED or NEEDS_REVIEW

      return ctx.prisma.document.findUnique({
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

      const document = await ctx.prisma.document.updateMany({
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

      return ctx.prisma.document.findUnique({
        where: { id: documentId },
      })
    }),
})
