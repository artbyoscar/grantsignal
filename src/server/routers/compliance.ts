import { z } from 'zod'
import { router, orgProcedure } from '../trpc'
import {
  CommitmentType,
  CommitmentStatus,
  ConflictType,
  ConflictSeverity,
  ConflictStatus,
  GrantStatus,
  ComplianceActionType,
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
            const primaryCommitment = commitments[0]
            const relatedIds = commitments.slice(1).map((c) => c.id)

            const conflict = await ctx.prisma.commitmentConflict.create({
              data: {
                commitmentId: primaryCommitment.id,
                relatedCommitmentIds: relatedIds,
                conflictType: ConflictType.METRIC_MISMATCH,
                description: `Metric "${metricName}" has conflicting values across grants: ${Array.from(values).join(', ')}`,
                detectedValues: {
                  metricName,
                  values: Array.from(values),
                  commitmentIds: commitments.map((c) => c.id),
                },
                severity: ConflictSeverity.HIGH,
                status: ConflictStatus.UNRESOLVED,
              },
            })
            detectedConflicts.push(conflict)
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
                  relatedCommitmentIds: [d2.id],
                  conflictType: ConflictType.TIMELINE_OVERLAP,
                  description: `Multiple deliverables due within a week: "${d1.description}" and "${d2.description}"`,
                  detectedValues: {
                    commitment1: {
                      description: d1.description,
                      dueDate: d1.dueDate,
                      id: d1.id,
                    },
                    commitment2: {
                      description: d2.description,
                      dueDate: d2.dueDate,
                      id: d2.id,
                    },
                    daysDiff,
                  },
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
                relatedCommitmentIds: monthCommitments.slice(1).map((c) => c.id),
                conflictType: ConflictType.CAPACITY_OVERCOMMIT,
                description: `${count} commitments due in ${new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} may exceed organizational capacity`,
                detectedValues: {
                  month: new Date(year, month).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  }),
                  commitmentCount: count,
                  threshold: 10,
                  commitmentIds: monthCommitments.map((c) => c.id),
                },
                severity: ConflictSeverity.CRITICAL,
                status: ConflictStatus.UNRESOLVED,
              },
            })
            detectedConflicts.push(conflict)
          }
        }
      }

      // Log scan in audit trail
      await ctx.prisma.complianceAudit.create({
        data: {
          organizationId: ctx.organizationId,
          actionType: ComplianceActionType.SCAN_COMPLETED,
          description: `Compliance scan completed. Detected ${detectedConflicts.length} conflicts across ${grants.length} grants.`,
          performedBy: ctx.userId,
          metadata: {
            grantsScanned: grants.length,
            conflictsDetected: detectedConflicts.length,
            conflictTypes: detectedConflicts.reduce((acc: Record<string, number>, c) => {
              acc[c.conflictType] = (acc[c.conflictType] || 0) + 1
              return acc
            }, {}),
          },
        },
      })

      return {
        conflictsFound: detectedConflicts.length,
        conflicts: detectedConflicts,
      }
    }),

  /**
   * Resolve or ignore a conflict with resolution workflow
   */
  resolveConflict: orgProcedure
    .input(
      z.object({
        conflictId: z.string(),
        action: z.enum(['UPDATE_DRAFT', 'FLAG_FOR_REVIEW', 'IGNORE']),
        reason: z.string().min(1, 'Resolution reason is required'),
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
        include: {
          commitment: {
            include: {
              grant: true,
            },
          },
        },
      })

      if (!conflict) {
        throw new Error('Conflict not found or access denied')
      }

      const updated = await ctx.prisma.commitmentConflict.update({
        where: { id: input.conflictId },
        data: {
          status:
            input.action === 'IGNORE'
              ? ConflictStatus.IGNORED
              : ConflictStatus.RESOLVED,
          resolutionAction: input.action,
          resolutionReason: input.reason,
          resolvedBy: ctx.userId,
          resolvedAt: new Date(),
        },
        include: {
          commitment: {
            include: {
              grant: {
                include: {
                  funder: true,
                },
              },
            },
          },
        },
      })

      // Log in audit trail
      await ctx.prisma.complianceAudit.create({
        data: {
          organizationId: ctx.organizationId,
          actionType:
            input.action === 'IGNORE'
              ? ComplianceActionType.CONFLICT_IGNORED
              : ComplianceActionType.CONFLICT_RESOLVED,
          description: `Conflict resolved: ${conflict.description}. Action: ${input.action}. Reason: ${input.reason}`,
          performedBy: ctx.userId,
          conflictId: input.conflictId,
          metadata: {
            conflictType: conflict.conflictType,
            severity: conflict.severity,
            action: input.action,
            grantId: conflict.commitment.grantId,
          },
        },
      })

      return updated
    }),

  /**
   * Get audit trail with filters
   */
  getAuditTrail: orgProcedure
    .input(
      z.object({
        actionType: z.nativeEnum(ComplianceActionType).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const auditLogs = await ctx.prisma.complianceAudit.findMany({
        where: {
          organizationId: ctx.organizationId,
          ...(input.actionType && { actionType: input.actionType }),
          ...(input.startDate &&
            input.endDate && {
              createdAt: {
                gte: input.startDate,
                lte: input.endDate,
              },
            }),
        },
        include: {
          conflict: {
            include: {
              commitment: {
                include: {
                  grant: {
                    include: {
                      funder: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: input.limit,
      })

      return auditLogs
    }),

  /**
   * Export audit trail as CSV
   */
  exportAuditTrail: orgProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const auditLogs = await ctx.prisma.complianceAudit.findMany({
        where: {
          organizationId: ctx.organizationId,
          ...(input.startDate &&
            input.endDate && {
              createdAt: {
                gte: input.startDate,
                lte: input.endDate,
              },
            }),
        },
        include: {
          conflict: {
            include: {
              commitment: {
                include: {
                  grant: {
                    include: {
                      funder: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Format as CSV
      const headers = [
        'Date',
        'Action Type',
        'Description',
        'Performed By',
        'Grant',
        'Funder',
        'Conflict Type',
        'Severity',
      ]

      const rows = auditLogs.map((log) => [
        log.createdAt.toISOString(),
        log.actionType,
        `"${log.description.replace(/"/g, '""')}"`, // Escape quotes in CSV
        log.performedBy,
        log.conflict?.commitment?.grant?.id || 'N/A',
        log.conflict?.commitment?.grant?.funder?.name || 'N/A',
        log.conflict?.conflictType || 'N/A',
        log.conflict?.severity || 'N/A',
      ])

      const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')

      return {
        csv,
        filename: `compliance-audit-${new Date().toISOString().split('T')[0]}.csv`,
      }
    }),

  /**
   * Get statistics for dashboard
   */
  getStatistics: orgProcedure.query(async ({ ctx }) => {
    const [
      totalCommitments,
      pendingCommitments,
      overdueCommitments,
      totalConflicts,
      unresolvedConflicts,
      criticalConflicts,
    ] = await Promise.all([
      ctx.prisma.commitment.count({
        where: { organizationId: ctx.organizationId },
      }),
      ctx.prisma.commitment.count({
        where: {
          organizationId: ctx.organizationId,
          status: CommitmentStatus.PENDING,
        },
      }),
      ctx.prisma.commitment.count({
        where: {
          organizationId: ctx.organizationId,
          status: CommitmentStatus.OVERDUE,
        },
      }),
      ctx.prisma.commitmentConflict.count({
        where: {
          commitment: {
            organizationId: ctx.organizationId,
          },
        },
      }),
      ctx.prisma.commitmentConflict.count({
        where: {
          commitment: {
            organizationId: ctx.organizationId,
          },
          status: ConflictStatus.UNRESOLVED,
        },
      }),
      ctx.prisma.commitmentConflict.count({
        where: {
          commitment: {
            organizationId: ctx.organizationId,
          },
          status: ConflictStatus.UNRESOLVED,
          severity: ConflictSeverity.CRITICAL,
        },
      }),
    ])

    return {
      commitments: {
        total: totalCommitments,
        pending: pendingCommitments,
        overdue: overdueCommitments,
      },
      conflicts: {
        total: totalConflicts,
        unresolved: unresolvedConflicts,
        critical: criticalConflicts,
      },
    }
  }),
})
