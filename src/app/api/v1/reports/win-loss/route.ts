import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createRestHandler,
  parseQueryParams,
} from '@/server/api/rest/handler';
import { appRouter } from '@/server/routers/_app';
import { db } from '@/server/db';

/**
 * Query parameters for win-loss analysis
 */
const winLossAnalysisSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  programId: z.string().optional(),
});

/**
 * GET /api/v1/reports/win-loss
 * Get win-loss analysis with success metrics
 */
export const GET = createRestHandler(
  async (ctx) => {
    const params = parseQueryParams(ctx.request, winLossAnalysisSchema);

    const caller = appRouter.createCaller({
      auth: { userId: null },
      organizationId: ctx.organizationId,
      db,
    });

    const analysis = await caller.reports.getWinLossAnalysis({
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
      programId: params.programId,
    });

    return analysis;
  },
  {
    requiredScopes: ['reports:read'],
  }
);
