import { z } from 'zod';
import { router, orgProcedure } from '../trpc';
import { extractCommitmentsFromDocument } from '../services/compliance/commitment-extractor';
import { detectConflicts, resolveConflict } from '../services/compliance/conflict-detector';
import { CommitmentType, CommitmentStatus, ConflictStatus } from '@prisma/client';

export const complianceRouter = router({

  // Extract commitments from a document
  extractCommitments: orgProcedure
    .input(z.object({
      documentId: z.string(),
      grantId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const commitments = await extractCommitmentsFromDocument(
        input.documentId,
        input.grantId
      );
      return { count: commitments.length, commitments };
    }),

  // Batch extract commitments from multiple grants
  batchExtractCommitments: orgProcedure
    .input(z.object({
      grantIds: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find all awarded grants with completed award documents
      const grants = await ctx.db.grant.findMany({
        where: {
          organizationId: ctx.organizationId,
          status: 'AWARDED',
          id: input.grantIds ? { in: input.grantIds } : undefined,
          documents: {
            some: {
              type: { in: ['AWARD_LETTER', 'AGREEMENT'] },
              status: 'COMPLETED',
            },
          },
        },
        include: {
          documents: {
            where: {
              type: { in: ['AWARD_LETTER', 'AGREEMENT'] },
              status: 'COMPLETED',
            },
          },
          funder: true,
        },
      })

      const results = []

      for (const grant of grants) {
        for (const doc of grant.documents) {
          try {
            const commitments = await extractCommitmentsFromDocument(doc.id, grant.id)
            results.push({
              grantId: grant.id,
              grantName: grant.funder?.name || 'Unknown',
              documentId: doc.id,
              documentName: doc.name,
              count: commitments.length,
              success: true,
            })
          } catch (error) {
            results.push({
              grantId: grant.id,
              grantName: grant.funder?.name || 'Unknown',
              documentId: doc.id,
              documentName: doc.name,
              count: 0,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }
      }

      // Log audit
      await ctx.db.complianceAudit.create({
        data: {
          organizationId: ctx.organizationId,
          actionType: 'SCAN_COMPLETED',
          description: `Batch extracted commitments from ${grants.length} grants`,
          performedBy: ctx.auth.userId!,
          metadata: { grantCount: grants.length, results },
        },
      })

      return {
        processed: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      }
    }),

  // Get all commitments for organization
  listCommitments: orgProcedure
    .input(z.object({
      grantId: z.string().optional(),
      status: z.nativeEnum(CommitmentStatus).optional(),
      type: z.nativeEnum(CommitmentType).optional(),
      dueBefore: z.date().optional(),
      dueAfter: z.date().optional(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const commitments = await ctx.db.commitment.findMany({
        where: {
          organizationId: ctx.organizationId,
          grantId: input.grantId,
          status: input.status,
          type: input.type,
          dueDate: {
            gte: input.dueAfter,
            lte: input.dueBefore
          }
        },
        include: {
          grant: {
            include: { funder: true }
          },
          conflicts: true
        },
        orderBy: { dueDate: 'asc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined
      });

      let nextCursor: string | undefined;
      if (commitments.length > input.limit) {
        const nextItem = commitments.pop();
        nextCursor = nextItem?.id;
      }

      return { commitments, nextCursor };
    }),

  // Get commitment by ID
  getCommitment: orgProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.commitment.findUnique({
        where: { id: input.id, organizationId: ctx.organizationId },
        include: {
          grant: { include: { funder: true } },
          conflicts: true
        }
      });
    }),

  // Manually add a commitment
  createCommitment: orgProcedure
    .input(z.object({
      grantId: z.string(),
      type: z.nativeEnum(CommitmentType),
      description: z.string(),
      metricName: z.string().optional(),
      metricValue: z.string().optional(),
      dueDate: z.date().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.commitment.create({
        data: {
          organizationId: ctx.organizationId,
          ...input,
          extractedBy: 'MANUAL',
          confidence: 100,
          status: 'PENDING'
        }
      });
    }),

  // Update commitment status
  updateCommitmentStatus: orgProcedure
    .input(z.object({
      id: z.string(),
      status: z.nativeEnum(CommitmentStatus)
    }))
    .mutation(async ({ ctx, input }) => {
      // Get the commitment to check due date
      const commitment = await ctx.db.commitment.findUnique({
        where: { id: input.id, organizationId: ctx.organizationId }
      });

      if (!commitment) {
        throw new Error('Commitment not found');
      }

      // Auto-set to OVERDUE if past due date and not completed
      let finalStatus = input.status;
      if (
        commitment.dueDate &&
        commitment.dueDate < new Date() &&
        input.status !== 'COMPLETED'
      ) {
        finalStatus = 'OVERDUE';
      }

      return ctx.db.commitment.update({
        where: { id: input.id, organizationId: ctx.organizationId },
        data: { status: finalStatus }
      });
    }),

  // Delete commitment
  deleteCommitment: orgProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.commitment.delete({
        where: { id: input.id, organizationId: ctx.organizationId }
      });
    }),

  // Verify an AI-extracted commitment
  verifyCommitment: orgProcedure
    .input(z.object({
      id: z.string(),
      verified: z.boolean(),
      correctedDescription: z.string().optional(),
      correctedMetricValue: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      if (!input.verified) {
        // Delete unverified commitment
        return ctx.db.commitment.delete({
          where: { id: input.id, organizationId: ctx.organizationId }
        });
      }

      return ctx.db.commitment.update({
        where: { id: input.id, organizationId: ctx.organizationId },
        data: {
          verifiedAt: new Date(),
          verifiedBy: ctx.auth.userId,
          description: input.correctedDescription,
          metricValue: input.correctedMetricValue
        }
      });
    }),

  // Run conflict detection
  detectConflicts: orgProcedure
    .mutation(async ({ ctx }) => {
      const conflicts = await detectConflicts(ctx.organizationId);
      return { count: conflicts.length, conflicts };
    }),

  // Get all conflicts
  listConflicts: orgProcedure
    .input(z.object({
      status: z.nativeEnum(ConflictStatus).optional(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional()
    }))
    .query(async ({ ctx, input }) => {
      return ctx.db.commitmentConflict.findMany({
        where: {
          commitment: { organizationId: ctx.organizationId },
          status: input.status,
          severity: input.severity
        },
        include: {
          commitment: {
            include: {
              grant: { include: { funder: true } }
            }
          }
        },
        orderBy: [
          { severity: 'desc' },
          { createdAt: 'desc' }
        ]
      });
    }),

  // Resolve a conflict
  resolveConflict: orgProcedure
    .input(z.object({
      conflictId: z.string(),
      resolution: z.enum(['RESOLVED', 'IGNORED']),
      notes: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      await resolveConflict(
        input.conflictId,
        input.resolution,
        input.notes,
        ctx.auth.userId!
      );
      return { success: true };
    }),

  // Get compliance summary for dashboard
  getSummary: orgProcedure
    .query(async ({ ctx }) => {
      const [
        totalCommitments,
        pendingCommitments,
        overdueCommitments,
        unresolvedConflicts,
        criticalConflicts
      ] = await Promise.all([
        ctx.db.commitment.count({
          where: { organizationId: ctx.organizationId }
        }),
        ctx.db.commitment.count({
          where: { organizationId: ctx.organizationId, status: 'PENDING' }
        }),
        ctx.db.commitment.count({
          where: {
            organizationId: ctx.organizationId,
            status: 'PENDING',
            dueDate: { lt: new Date() }
          }
        }),
        ctx.db.commitmentConflict.count({
          where: {
            commitment: { organizationId: ctx.organizationId },
            status: 'UNRESOLVED'
          }
        }),
        ctx.db.commitmentConflict.count({
          where: {
            commitment: { organizationId: ctx.organizationId },
            status: 'UNRESOLVED',
            severity: 'CRITICAL'
          }
        })
      ]);

      // Get upcoming commitments (next 30 days)
      const upcomingCommitments = await ctx.db.commitment.findMany({
        where: {
          organizationId: ctx.organizationId,
          status: 'PENDING',
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          grant: { include: { funder: true } }
        },
        orderBy: { dueDate: 'asc' },
        take: 5
      });

      return {
        totalCommitments,
        pendingCommitments,
        overdueCommitments,
        unresolvedConflicts,
        criticalConflicts,
        upcomingCommitments,
        healthScore: calculateHealthScore({
          overdueCommitments,
          unresolvedConflicts,
          criticalConflicts
        })
      };
    })
});

function calculateHealthScore(metrics: {
  overdueCommitments: number;
  unresolvedConflicts: number;
  criticalConflicts: number;
}): number {
  let score = 100;
  score -= metrics.overdueCommitments * 10;
  score -= metrics.unresolvedConflicts * 5;
  score -= metrics.criticalConflicts * 15;
  return Math.max(0, Math.min(100, score));
}
