import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createRestHandler,
  parseQueryParams,
} from '@/server/api/rest/handler';
import { appRouter } from '@/server/routers/_app';
import { db } from '@/server/db';

/**
 * Query parameters for searching documents
 */
const searchDocumentsSchema = z.object({
  query: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

/**
 * GET /api/v1/documents/search
 * Search documents using vector similarity
 */
export const GET = createRestHandler(
  async (ctx) => {
    const params = parseQueryParams(ctx.request, searchDocumentsSchema);

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    const results = await caller.documents.search({
      query: params.query,
      limit: params.limit,
    });

    return {
      query: params.query,
      results,
    };
  },
  {
    requiredScopes: ['documents:read'],
  }
);
