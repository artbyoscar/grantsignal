import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createRestHandler,
  parseJsonBody,
} from '@/server/api/rest/handler';
import { appRouter } from '@/server/routers/_app';
import { db } from '@/server/db';

/**
 * Body schema for confirming document upload
 */
const confirmUploadSchema = z.object({
  confirm: z.literal(true),
});

/**
 * Body schema for updating document status
 */
const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
});

/**
 * GET /api/v1/documents/:id
 * Get a specific document by ID
 */
export const GET = createRestHandler(
  async (ctx, params) => {
    if (!params?.id) {
      throw new Error('Document ID is required');
    }

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    const document = await caller.documents.byId({ id: params.id });

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  },
  {
    requiredScopes: ['documents:read'],
  }
);

/**
 * PUT /api/v1/documents/:id
 * Update document status or confirm upload
 */
export const PUT = createRestHandler(
  async (ctx, params) => {
    if (!params?.id) {
      throw new Error('Document ID is required');
    }

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    // Try to parse as confirm upload first
    try {
      const body = await parseJsonBody(ctx.request, confirmUploadSchema);
      const document = await caller.documents.confirmUpload({ documentId: params.id });
      return document;
    } catch (e) {
      // If not confirm upload, try status update
      ctx.request = ctx.request.clone(); // Clone to re-read body
      const body = await parseJsonBody(ctx.request, updateStatusSchema);
      const document = await caller.documents.updateStatus({
        id: params.id,
        status: body.status,
      });
      return document;
    }
  },
  {
    requiredScopes: ['documents:write'],
  }
);
