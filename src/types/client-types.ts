/**
 * Client-safe types for GrantSignal
 *
 * These types match the actual API responses and are safe to use in client components.
 * DO NOT import from @prisma/client in client components - use these types instead.
 */

// ============================================================================
// Grant Status
// ============================================================================

/**
 * Grant status enum as const object (client-safe)
 * Matches the Prisma GrantStatus enum but safe for client use
 */
export const GrantStatus = {
  PROSPECT: 'PROSPECT',
  RESEARCHING: 'RESEARCHING',
  WRITING: 'WRITING',
  REVIEW: 'REVIEW',
  SUBMITTED: 'SUBMITTED',
  PENDING: 'PENDING',
  AWARDED: 'AWARDED',
  DECLINED: 'DECLINED',
  ACTIVE: 'ACTIVE',
  CLOSEOUT: 'CLOSEOUT',
  COMPLETED: 'COMPLETED'
} as const

export type GrantStatus = typeof GrantStatus[keyof typeof GrantStatus]

// ============================================================================
// Funder Type
// ============================================================================

/**
 * Funder type enum as const object (client-safe)
 * Matches the Prisma FunderType enum but safe for client use
 */
export const FunderType = {
  PRIVATE_FOUNDATION: 'PRIVATE_FOUNDATION',
  COMMUNITY_FOUNDATION: 'COMMUNITY_FOUNDATION',
  CORPORATE: 'CORPORATE',
  FEDERAL: 'FEDERAL',
  STATE: 'STATE',
  LOCAL: 'LOCAL',
  OTHER: 'OTHER',
} as const

export type FunderType = typeof FunderType[keyof typeof FunderType]

// ============================================================================
// Grant Interface
// ============================================================================

/**
 * Grant type as returned by api.grants.list
 *
 * Manual interface to avoid pulling Prisma types into client bundle.
 * Decimal fields are converted to number at the data boundary.
 */
export interface Grant {
  id: string
  status: GrantStatus
  amountRequested: number | null
  amountAwarded: number | null
  deadline: Date | null
  submittedAt: Date | null
  assignedAt: Date | null
  awardedAt: Date | null
  startDate: Date | null
  endDate: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  organizationId: string
  funderId: string | null
  opportunityId: string | null
  programId: string | null
  assignedToId: string | null

  // Relations
  funder: {
    id: string
    name: string
    type: FunderType | null
  } | null
  opportunity: {
    id: string
    title: string
    deadline: Date | null
    fitScores?: Array<{
      overallScore: number
      missionScore: number
      capacityScore: number
      historyScore: number
    }>
  } | null
  program: {
    id: string
    name: string
  } | null
  assignedTo: {
    id: string
    clerkUserId: string
    displayName: string | null
    avatarUrl: string | null
  } | null
}

/**
 * Grant type with full details as returned by api.grants.byId
 *
 * Includes additional relations like documents, commitments, and fit scores.
 */
export interface GrantWithDetails extends Grant {
  _count: {
    documents: number
    commitments: number
  }
}
