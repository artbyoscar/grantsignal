import { db } from '@/server/db'
import type { InAppNotificationType } from '@prisma/client'

interface CreateNotificationOptions {
  organizationId: string
  userId?: string // If not provided, notification is org-wide
  type: InAppNotificationType
  title: string
  message: string
  linkUrl?: string
}

/**
 * Creates an in-app notification for a user or organization
 * Can be called from background jobs, tRPC mutations, or other server-side code
 */
export async function createNotification(options: CreateNotificationOptions) {
  const notification = await db.notification.create({
    data: {
      organizationId: options.organizationId,
      userId: options.userId || null,
      type: options.type,
      title: options.title,
      message: options.message,
      linkUrl: options.linkUrl || null,
    },
  })

  return notification
}

/**
 * Creates notifications for all users in an organization
 */
export async function createNotificationForAllUsers(
  options: Omit<CreateNotificationOptions, 'userId'> & { userIds?: string[] }
) {
  const { userIds, ...notificationData } = options

  // If specific userIds are provided, create for those users only
  // Otherwise, fetch all users in the organization
  const targetUserIds = userIds || (
    await db.organizationUser.findMany({
      where: { organizationId: options.organizationId },
      select: { id: true },
    })
  ).map(u => u.id)

  const notifications = await db.notification.createMany({
    data: targetUserIds.map(userId => ({
      organizationId: notificationData.organizationId,
      userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      linkUrl: notificationData.linkUrl || null,
    })),
  })

  return notifications
}

/**
 * Helper to create deadline notifications
 */
export async function createDeadlineNotification(options: {
  organizationId: string
  userId?: string
  grantName: string
  daysUntilDeadline: number
  grantId: string
}) {
  return createNotification({
    organizationId: options.organizationId,
    userId: options.userId,
    type: 'DEADLINE',
    title: 'Grant deadline approaching',
    message: `${options.grantName} is due in ${options.daysUntilDeadline} day${options.daysUntilDeadline === 1 ? '' : 's'}.`,
    linkUrl: `/pipeline?grantId=${options.grantId}`,
  })
}

/**
 * Helper to create document processed notifications
 */
export async function createDocumentProcessedNotification(options: {
  organizationId: string
  userId?: string
  documentName: string
  documentId: string
}) {
  return createNotification({
    organizationId: options.organizationId,
    userId: options.userId,
    type: 'DOCUMENT',
    title: 'Document processing complete',
    message: `${options.documentName} has been processed and indexed.`,
    linkUrl: `/documents?documentId=${options.documentId}`,
  })
}

/**
 * Helper to create opportunity match notifications
 */
export async function createOpportunityNotification(options: {
  organizationId: string
  userId?: string
  count: number
  opportunityId?: string
}) {
  return createNotification({
    organizationId: options.organizationId,
    userId: options.userId,
    type: 'OPPORTUNITY',
    title: 'New opportunity match',
    message: `Found ${options.count} new funding opportunit${options.count === 1 ? 'y' : 'ies'} matching your programs.`,
    linkUrl: options.opportunityId ? `/opportunities/${options.opportunityId}` : '/opportunities',
  })
}

/**
 * Helper to create team mention notifications
 */
export async function createTeamMentionNotification(options: {
  organizationId: string
  userId: string // Required - this is who was mentioned
  mentionedBy: string
  context: string
  linkUrl: string
}) {
  return createNotification({
    organizationId: options.organizationId,
    userId: options.userId,
    type: 'TEAM',
    title: 'Team member mentioned you',
    message: `${options.mentionedBy} mentioned you in ${options.context}.`,
    linkUrl: options.linkUrl,
  })
}

/**
 * Helper to create system notifications
 */
export async function createSystemNotification(options: {
  organizationId: string
  userId?: string
  title: string
  message: string
  linkUrl?: string
}) {
  return createNotification({
    organizationId: options.organizationId,
    userId: options.userId,
    type: 'SYSTEM',
    title: options.title,
    message: options.message,
    linkUrl: options.linkUrl,
  })
}
