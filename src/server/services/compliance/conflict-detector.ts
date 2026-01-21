import { db } from '@/server/db';
import { ConflictType, ConflictSeverity } from '@prisma/client';
import { emitComplianceConflictDetected } from '@/server/services/webhooks/emitter';

interface DetectedConflict {
  type: ConflictType;
  description: string;
  severity: ConflictSeverity;
  commitmentIds: string[];
  affectedGrants: string[];
  suggestedResolution: string;
}

export async function detectConflicts(organizationId: string): Promise<DetectedConflict[]> {
  const conflicts: DetectedConflict[] = [];

  // Get all active commitments
  const commitments = await db.commitment.findMany({
    where: {
      organizationId,
      grant: {
        status: { in: ['WRITING', 'REVIEW', 'SUBMITTED', 'PENDING', 'AWARDED', 'ACTIVE'] }
      }
    },
    include: {
      grant: {
        include: { funder: true }
      }
    }
  });

  // 1. METRIC_MISMATCH: Same metric with different values
  const metricGroups = new Map<string, typeof commitments>();

  for (const c of commitments) {
    if (c.metricName && c.metricValue) {
      const key = c.metricName.toLowerCase().trim();
      if (!metricGroups.has(key)) {
        metricGroups.set(key, []);
      }
      metricGroups.get(key)!.push(c);
    }
  }

  for (const [metric, group] of metricGroups) {
    if (group.length > 1) {
      const uniqueValues = [...new Set(group.map(c => c.metricValue))];

      if (uniqueValues.length > 1) {
        const details = group.map(c =>
          `${c.metricValue} to ${c.grant.funder?.name || 'Unknown Funder'}`
        ).join(', ');

        // Calculate severity based on variance
        const numericValues = uniqueValues.map(v => parseFloat(v || '0')).filter(n => !isNaN(n));
        const variance = numericValues.length > 1
          ? (Math.max(...numericValues) - Math.min(...numericValues)) / Math.max(...numericValues)
          : 0;

        const severity: ConflictSeverity = variance > 0.25 ? 'CRITICAL' : variance > 0.1 ? 'HIGH' : 'MEDIUM';

        conflicts.push({
          type: 'METRIC_MISMATCH',
          description: `Different values for "${metric}": ${details}`,
          severity,
          commitmentIds: group.map(c => c.id),
          affectedGrants: [...new Set(group.map(c => c.grantId))],
          suggestedResolution: `Review and align the "${metric}" metric across all applications. Consider which value is most accurate and update accordingly.`
        });
      }
    }
  }

  // 2. TIMELINE_OVERLAP: Conflicting delivery dates for same deliverable
  const deliverables = commitments.filter(c => c.type === 'DELIVERABLE' && c.dueDate);
  const deliverableGroups = new Map<string, typeof deliverables>();

  for (const d of deliverables) {
    // Normalize description for grouping
    const key = d.description.toLowerCase().slice(0, 50);
    if (!deliverableGroups.has(key)) {
      deliverableGroups.set(key, []);
    }
    deliverableGroups.get(key)!.push(d);
  }

  for (const [desc, group] of deliverableGroups) {
    if (group.length > 1) {
      const dates = group.map(d => d.dueDate!.getTime());
      const dateRange = Math.max(...dates) - Math.min(...dates);
      const daysDiff = dateRange / (1000 * 60 * 60 * 24);

      if (daysDiff > 30) { // More than 30 days difference
        conflicts.push({
          type: 'TIMELINE_OVERLAP',
          description: `Conflicting timelines for similar deliverable: "${group[0].description.slice(0, 100)}"`,
          severity: daysDiff > 90 ? 'HIGH' : 'MEDIUM',
          commitmentIds: group.map(c => c.id),
          affectedGrants: [...new Set(group.map(c => c.grantId))],
          suggestedResolution: `Review delivery dates and ensure they are achievable. Consider if these are actually the same deliverable or distinct items.`
        });
      }
    }
  }

  // 3. CAPACITY_OVERCOMMIT: Total commitments exceed reasonable capacity
  const staffingCommitments = commitments.filter(c => c.type === 'STAFFING');
  const totalFTEPromised = staffingCommitments.reduce((sum, c) => {
    const match = c.metricValue?.match(/(\d+\.?\d*)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  if (totalFTEPromised > 10) { // Arbitrary threshold - should be configurable
    conflicts.push({
      type: 'CAPACITY_OVERCOMMIT',
      description: `Total staffing commitments (${totalFTEPromised.toFixed(1)} FTE) may exceed organizational capacity`,
      severity: totalFTEPromised > 20 ? 'CRITICAL' : 'HIGH',
      commitmentIds: staffingCommitments.map(c => c.id),
      affectedGrants: [...new Set(staffingCommitments.map(c => c.grantId))],
      suggestedResolution: `Review staffing allocations across all grants. Ensure total FTE commitments are achievable with current and planned staff.`
    });
  }

  // 4. BUDGET_DISCREPANCY: Check for budget inconsistencies (placeholder for future)
  // Would compare budget narratives across applications

  // Store conflicts in database
  for (const conflict of conflicts) {
    // Check if this conflict already exists (avoid duplicates)
    const existing = await db.commitmentConflict.findFirst({
      where: {
        commitmentId: conflict.commitmentIds[0],
        conflictType: conflict.type,
        status: 'UNRESOLVED'
      }
    });

    if (!existing) {
      const newConflict = await db.commitmentConflict.create({
        data: {
          commitmentId: conflict.commitmentIds[0],
          conflictType: conflict.type,
          description: conflict.description,
          severity: conflict.severity,
          affectedGrants: conflict.affectedGrants,
          suggestedResolution: conflict.suggestedResolution,
          status: 'UNRESOLVED'
        }
      });

      // Emit webhook event for new conflict
      await emitComplianceConflictDetected(
        organizationId,
        newConflict.id,
        newConflict.commitmentId,
        newConflict.conflictType,
        newConflict.severity,
        {
          id: newConflict.id,
          conflictType: newConflict.conflictType,
          severity: newConflict.severity,
          description: newConflict.description,
          resolutionAction: newConflict.resolutionAction,
        }
      ).catch((error) => {
        console.error('Failed to emit webhook event:', error)
        // Don't fail the detection if webhook fails
      })
    }
  }

  return conflicts;
}

export async function resolveConflict(
  conflictId: string,
  resolution: 'RESOLVED' | 'IGNORED',
  notes: string,
  userId: string
): Promise<void> {
  await db.commitmentConflict.update({
    where: { id: conflictId },
    data: {
      status: resolution,
      resolutionNotes: notes,
      resolvedAt: new Date(),
      resolvedBy: userId
    }
  });
}
