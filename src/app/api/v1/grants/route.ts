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
 * Query parameters for listing grants
 */
const listGrantsSchema = z.object({
  status: z.enum(['DRAFT', 'SUBMITTED', 'AWARDED', 'REJECTED', 'ACTIVE', 'COMPLETED']).optional(),
  programId: z.string().optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Body schema for creating a grant
 */
const createGrantSchema = z.object({
  funderId: z.string().optional(),
  opportunityId: z.string().optional(),
  programId: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'AWARDED', 'REJECTED', 'ACTIVE', 'COMPLETED']).optional(),
  amountRequested: z.number().optional(),
  deadline: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/v1/grants
 * List grants for the authenticated organization
 */
export const GET = createRestHandler(
  async (ctx) => {
    const params = parseQueryParams(ctx.request, listGrantsSchema);

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    // Use cursor-based pagination from tRPC, but convert to page-based for REST
    const skip = (params.page - 1) * params.pageSize;

    const result = await caller.grants.list({
      status: params.status,
      programId: params.programId,
      assignedToId: params.assignedToId,
      search: params.search,
      limit: params.pageSize,
    });

    // Get total count for pagination
    const total = await db.grant.count({
      where: {
        organizationId: ctx.organizationId,
        ...(params.status ? { status: params.status } : {}),
        ...(params.programId ? { programId: params.programId } : {}),
        ...(params.assignedToId ? { assignedToId: params.assignedToId } : {}),
        ...(params.search ? {
          OR: [
            { title: { contains: params.search, mode: 'insensitive' } },
            { description: { contains: params.search, mode: 'insensitive' } },
          ],
        } : {}),
      },
    });

    return createPaginatedResponse(result.grants, total, params.page, params.pageSize);
  },
  {
    requiredScopes: ['grants:read'],
  }
);

/**
 * POST /api/v1/grants
 * Create a new grant
 */
export const POST = createRestHandler(
  async (ctx) => {
    const body = await parseJsonBody(ctx.request, createGrantSchema);

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    const grant = await caller.grants.create({
      ...body,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
    });

    return grant;
  },
  {
    requiredScopes: ['grants:write'],
  }
);
