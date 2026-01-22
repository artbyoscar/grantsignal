import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createRestHandler,
  parseJsonBody,
  parseQueryParams,
  createPaginatedResponse,
} from '@/server/api/rest/handler';
import { appRouter } from '@/server/routers/_app';
import { db } from '@/server/db';

/**
 * Query parameters for listing documents
 */
const listDocumentsSchema = z.object({
  grantId: z.string().optional(),
  type: z.enum(['PROPOSAL', 'LOI', 'AWARD_LETTER', 'REPORT', 'AGREEMENT', 'BUDGET', 'ANNUAL_REPORT', 'STRATEGIC_PLAN', 'EVALUATION', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Body schema for creating an upload URL
 */
const createUploadSchema = z.object({
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  grantId: z.string().optional(),
  type: z.enum(['PROPOSAL', 'LOI', 'AWARD_LETTER', 'REPORT', 'AGREEMENT', 'BUDGET', 'ANNUAL_REPORT', 'STRATEGIC_PLAN', 'EVALUATION', 'OTHER']).optional(),
});

/**
 * GET /api/v1/documents
 * List documents for the authenticated organization
 */
export const GET = createRestHandler(
  async (ctx) => {
    const params = parseQueryParams(ctx.request, listDocumentsSchema);

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    const result = await caller.documents.list({
      grantId: params.grantId,
      type: params.type,
      status: params.status,
    });

    // Filter by search if provided
    let filteredDocs = result;
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredDocs = result.filter(doc =>
        doc.name.toLowerCase().includes(searchLower) ||
        doc.extractedText?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const total = filteredDocs.length;
    const skip = (params.page - 1) * params.pageSize;
    const paginatedDocs = filteredDocs.slice(skip, skip + params.pageSize);

    return createPaginatedResponse(paginatedDocs, total, params.page, params.pageSize);
  },
  {
    requiredScopes: ['documents:read'],
  }
);

/**
 * POST /api/v1/documents
 * Create a presigned upload URL for a new document
 */
export const POST = createRestHandler(
  async (ctx) => {
    const body = await parseJsonBody(ctx.request, createUploadSchema);

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    const result = await caller.documents.createUploadUrl({
      fileName: body.fileName,
      fileSize: body.fileSize,
      fileType: body.mimeType,
      grantId: body.grantId,
      documentType: body.type || 'OTHER',
    });

    return result;
  },
  {
    requiredScopes: ['documents:write'],
  }
);
