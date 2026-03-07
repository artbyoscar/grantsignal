import { db } from '@/lib/prisma'

/**
 * Log an activity event for an organization.
 * This is a fire-and-forget utility - it should never block the main operation.
 */
export async function logActivity({
  organizationId,
  userId,
  action,
  entityType,
  entityId,
  description,
  metadata,
}: {
  organizationId: string
  userId?: string | null
  action: string
  entityType: string
  entityId?: string
  description: string
  metadata?: Record<string, unknown>
}) {
  try {
    await db.activityLog.create({
      data: {
        organizationId,
        userId: userId || undefined,
        action,
        entityType,
        entityId,
        description,
        metadata: metadata || undefined,
      },
    })
  } catch (error) {
    // Never fail the parent operation due to activity logging
    console.error('[ActivityLogger] Failed to log activity:', error)
  }
}

/**
 * Common activity action constants for type safety and consistency
 */
export const ActivityActions = {
  GRANT_CREATED: 'grant.created',
  GRANT_STATUS_CHANGED: 'grant.status_changed',
  GRANT_ASSIGNED: 'grant.assigned',
  GRANT_UNASSIGNED: 'grant.unassigned',
  DOCUMENT_UPLOADED: 'document.uploaded',
  DOCUMENT_PROCESSED: 'document.processed',
  COMMITMENT_EXTRACTED: 'commitment.extracted',
  CONFLICT_DETECTED: 'conflict.detected',
  CONFLICT_RESOLVED: 'conflict.resolved',
  TEAM_MEMBER_INVITED: 'team.invited',
  TEAM_MEMBER_JOINED: 'team.joined',
  TEAM_MEMBER_REMOVED: 'team.removed',
  VOICE_ANALYZED: 'voice.analyzed',
  AI_CONTENT_GENERATED: 'ai.generated',
  DRAFT_SAVED: 'writing.draft_saved',
  RFP_PARSED: 'discovery.rfp_parsed',
  OPPORTUNITY_SAVED: 'discovery.opportunity_saved',
} as const
