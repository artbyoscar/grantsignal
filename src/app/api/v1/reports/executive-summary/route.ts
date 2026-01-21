import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createRestHandler,
  parseQueryParams,
} from '@/server/api/rest/handler';
import { appRouter } from '@/server/routers/_app';
import { db } from '@/server/db';

/**
 * Query parameters for executive summary
 */
const executiveSummarySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /api/v1/reports/executive-summary
 * Get executive summary report
 */
export const GET = createRestHandler(
  async (ctx) => {
    const params = parseQueryParams(ctx.request, executiveSummarySchema);

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    const summary = await caller.reports.getExecutiveSummary({
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
    });

    return summary;
  },
  {
    requiredScopes: ['reports:read'],
  }
);
