import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createRestHandler,
  parseJsonBody,
  errorResponse,
} from '@/server/api/rest/handler';
import { appRouter } from '@/server/routers/_app';
import { db } from '@/server/db';

/**
 * Body schema for updating a grant
 */
const updateGrantSchema = z.object({
  funderId: z.string().optional(),
  opportunityId: z.string().optional(),
  programId: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'AWARDED', 'REJECTED', 'ACTIVE', 'COMPLETED']).optional(),
  amountRequested: z.number().optional(),
  amountAwarded: z.number().optional(),
  deadline: z.string().optional(),
  submittedAt: z.string().optional(),
  awardedAt: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  assignedToId: z.string().optional(),
  draftContent: z.string().optional(),
});

/**
 * GET /api/v1/grants/:id
 * Get a specific grant by ID
 */
export const GET = createRestHandler(
  async (ctx, params) => {
    if (!params?.id) {
      throw new Error('Grant ID is required');
    }

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    const grant = await caller.grants.byId({ id: params.id });

    if (!grant) {
      throw new Error('Grant not found');
    }

    return grant;
  },
  {
    requiredScopes: ['grants:read'],
  }
);

/**
 * PUT /api/v1/grants/:id
 * Update a grant
 */
export const PUT = createRestHandler(
  async (ctx, params) => {
    if (!params?.id) {
      throw new Error('Grant ID is required');
    }

    const body = await parseJsonBody(ctx.request, updateGrantSchema);

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    const grant = await caller.grants.update({
      id: params.id,
      ...body,
      deadline: body.deadline ? new Date(body.deadline) : undefined,
      submittedAt: body.submittedAt ? new Date(body.submittedAt) : undefined,
      awardedAt: body.awardedAt ? new Date(body.awardedAt) : undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });

    return grant;
  },
  {
    requiredScopes: ['grants:write'],
  }
);

/**
 * DELETE /api/v1/grants/:id
 * Delete a grant
 */
export const DELETE = createRestHandler(
  async (ctx, params) => {
    if (!params?.id) {
      throw new Error('Grant ID is required');
    }

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    await caller.grants.delete({ id: params.id });

    return { success: true, message: 'Grant deleted successfully' };
  },
  {
    requiredScopes: ['grants:write'],
  }
);
