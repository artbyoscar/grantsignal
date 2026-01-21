import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createRestHandler,
  parseQueryParams,
} from '@/server/api/rest/handler';
import { appRouter } from '@/server/routers/_app';
import { db } from '@/server/db';

/**
 * Query parameters for pipeline report
 */
const pipelineReportSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/v1/reports/pipeline
 * Get pipeline report with grants grouped by status
 */
export const GET = createRestHandler(
  async (ctx) => {
    const params = parseQueryParams(ctx.request, pipelineReportSchema);

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    const pipeline = await caller.reports.getPipelineReport({
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
    });

    return pipeline;
  },
  {
    requiredScopes: ['reports:read'],
  }
);
