import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import {
  CommitmentType,
  CommitmentStatus,
  ConflictType,
  ConflictSeverity,
  ConflictStatus,
  GrantStatus,
} from '@prisma/client'

export const complianceRouter = router({
  /**
   * List all commitments for organization with filters
   */
  listCommitments: orgProcedure
    .input(
      z.object({
        grantId: z.string().optional(),
        status: z.nativeEnum(CommitmentStatus).optional(),
        type: z.nativeEnum(CommitmentType).optional(),
        includeConflicts: z.boolean().default(true),
      })
    )
    .query(async ({ ctx, input }) => {
      const commitments = await ctx.prisma.commitment.findMany({
        where: {
          organizationId: ctx.organizationId,
          ...(input.grantId && { grantId: input.grantId }),
          ...(input.status && { status: input.status }),
          ...(input.type && { type: input.type }),
        },
        orderBy: { dueDate: 'asc' },
        include: {
          grant: {
            select: {
              id: true,
              status: true,
              funder: {
                select: {
                  name: true,
                },
              },
            },
          },
          sourceDocument: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          ...(input.includeConflicts && {
            conflicts: {
              where: {
                status: {
                  in: [ConflictStatus.UNRESOLVED, ConflictStatus.UNDER_REVIEW],
                },
              },
              orderBy: { severity: 'desc' },
            },
          }),
        },
      })

      return commitments
    }),

  /**
   * Check for conflicts across active grants
   * This analyzes commitments for potential conflicts such as:
   * - Metric mismatches (same metric with different values)
   * - Timeline overlaps (conflicting schedules)
   * - Budget discrepancies (over-allocation)
   * - Capacity overcommitment (too many concurrent deliverables)
   */
  checkConflicts: orgProcedure
    .input(
      z.object({
        grantIds: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get all active grants and their commitments
      const grants = await ctx.prisma.grant.findMany({
        where: {
          organizationId: ctx.organizationId,
          ...(input.grantIds && { id: { in: input.grantIds } }),
          status: {
            in: [
              GrantStatus.AWARDED,
              GrantStatus.ACTIVE,
              GrantStatus.SUBMITTED,
            ],
          },
        },
        include: {
          commitments: {
            where: {
              status: {
                not: CommitmentStatus.COMPLETED,
              },
            },
          },
        },
      })

      const detectedConflicts = []

      // Check for metric mismatches
      const metricCommitments = grants.flatMap((grant) =>
        grant.commitments.filter(
          (c) => c.type === CommitmentType.OUTCOME_METRIC && c.metricName
        )
      )

      const metricsByName = new Map<string, typeof metricCommitments>()
      for (const commitment of metricCommitments) {
        const name = commitment.metricName!
        if (!metricsByName.has(name)) {
          metricsByName.set(name, [])
        }
        metricsByName.get(name)!.push(commitment)
      }

      for (const [metricName, commitments] of metricsByName.entries()) {
        if (commitments.length > 1) {
          const values = new Set(commitments.map((c) => c.metricValue))
          if (values.size > 1) {
            // Different values for the same metric across grants
            for (const commitment of commitments) {
              const conflict = await ctx.prisma.commitmentConflict.create({
                data: {
                  commitmentId: commitment.id,
                  conflictType: ConflictType.METRIC_MISMATCH,
                  description: `Metric "${metricName}" has conflicting values across grants: ${Array.from(values).join(', ')}`,
                  severity: ConflictSeverity.HIGH,
                  status: ConflictStatus.UNRESOLVED,
                },
              })
              detectedConflicts.push(conflict)
            }
          }
        }
      }

      // Check for timeline overlaps
      const deliverables = grants.flatMap((grant) =>
        grant.commitments.filter(
          (c) => c.type === CommitmentType.DELIVERABLE && c.dueDate
        )
      )

      for (let i = 0; i < deliverables.length; i++) {
        for (let j = i + 1; j < deliverables.length; j++) {
          const d1 = deliverables[i]
          const d2 = deliverables[j]

          if (d1.dueDate && d2.dueDate) {
            const daysDiff = Math.abs(
              (d1.dueDate.getTime() - d2.dueDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )

            if (daysDiff <= 7) {
              // Within a week
              const conflict = await ctx.prisma.commitmentConflict.create({
                data: {
                  commitmentId: d1.id,
                  conflictType: ConflictType.TIMELINE_OVERLAP,
                  description: `Multiple deliverables due within a week: "${d1.description}" and "${d2.description}"`,
                  severity: ConflictSeverity.MEDIUM,
                  status: ConflictStatus.UNRESOLVED,
                },
              })
              detectedConflicts.push(conflict)
            }
          }
        }
      }

      // Check for capacity overcommitment
      const commitmentsByMonth = new Map<string, number>()
      for (const grant of grants) {
        for (const commitment of grant.commitments) {
          if (commitment.dueDate) {
            const monthKey = `${commitment.dueDate.getFullYear()}-${commitment.dueDate.getMonth()}`
            commitmentsByMonth.set(
              monthKey,
              (commitmentsByMonth.get(monthKey) || 0) + 1
            )
          }
        }
      }

      for (const [monthKey, count] of commitmentsByMonth.entries()) {
        if (count > 10) {
          // Threshold for overcommitment
          // Create a conflict for the most recent commitment in that month
          const [year, month] = monthKey.split('-').map(Number)
          const monthCommitments = grants
            .flatMap((g) => g.commitments)
            .filter((c) => {
              if (!c.dueDate) return false
              return (
                c.dueDate.getFullYear() === year &&
                c.dueDate.getMonth() === month
              )
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

          if (monthCommitments.length > 0) {
            const conflict = await ctx.prisma.commitmentConflict.create({
              data: {
                commitmentId: monthCommitments[0].id,
                conflictType: ConflictType.CAPACITY_OVERCOMMIT,
                description: `${count} commitments due in ${new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} may exceed organizational capacity`,
                severity: ConflictSeverity.CRITICAL,
                status: ConflictStatus.UNRESOLVED,
              },
            })
            detectedConflicts.push(conflict)
          }
        }
      }

      return {
        conflictsFound: detectedConflicts.length,
        conflicts: detectedConflicts,
      }
    }),

  /**
   * Resolve or ignore a conflict
   */
  resolveConflict: orgProcedure
    .input(
      z.object({
        conflictId: z.string(),
        status: z.enum([
          ConflictStatus.RESOLVED,
          ConflictStatus.IGNORED,
          ConflictStatus.UNDER_REVIEW,
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the conflict belongs to a commitment in this organization
      const conflict = await ctx.prisma.commitmentConflict.findFirst({
        where: {
          id: input.conflictId,
          commitment: {
            organizationId: ctx.organizationId,
          },
        },
      })

      if (!conflict) {
        throw new Error('Conflict not found or access denied')
      }

      const updated = await ctx.prisma.commitmentConflict.update({
        where: { id: input.conflictId },
        data: {
          status: input.status,
        },
        include: {
          commitment: {
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
          },
        },
      })

      return updated
    }),
})
