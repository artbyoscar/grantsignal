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
 * Grant type as returned by api.grants.list and api.grants.byId
 *
 * This interface matches EXACTLY what the API returns, including:
 * - All Grant model fields from the database
 * - Included relations (funder, opportunity, program, assignedTo)
 * - Aggregated counts (_count)
 *
 * IMPORTANT: The Grant model does NOT have a 'title' field.
 * The title comes from grant.opportunity.title
 */
export interface Grant {
  // Core fields
  id: string
  organizationId: string
  status: GrantStatus

  // Money fields (Prisma Decimal becomes number in JS)
  amountRequested: number | null
  amountAwarded: number | null

  // Date fields
  deadline: Date | null
  submittedAt: Date | null
  awardedAt: Date | null
  startDate: Date | null
  endDate: Date | null
  assignedAt: Date | null
  createdAt: Date
  updatedAt: Date

  // Foreign keys
  assignedToId: string | null  // Note: NOT 'assigneeId'
  funderId: string | null
  opportunityId: string | null
  programId: string | null

  // Text fields
  notes: string | null

  // Relations (from api.grants.list include)
  funder?: {
    id: string
    name: string
    type: FunderType
  } | null

  opportunity?: {
    id: string
    title: string
    deadline: Date | null
  } | null

  program?: {
    id: string
    name: string
  } | null

  assignedTo?: {
    id: string
    displayName: string | null
    avatarUrl: string | null
    clerkUserId: string
  } | null

  _count?: {
    documents: number
    commitments: number
  }
}

/**
 * Extended Grant type with fit scores (from api.grants.byId)
 *
 * When fetching a single grant with byId, the opportunity includes fitScores
 */
export interface GrantWithFitScores extends Grant {
  opportunity?: {
    id: string
    title: string
    deadline: Date | null
    fitScores?: Array<{
      id: string
      overallScore: number
      missionScore: number
      capacityScore: number
      historyScore: number
      reasoning: string | null
      createdAt: Date
    }>
  } | null

  // Additional fields from byId that include more details
  documents?: Array<{
    id: string
    name: string
    url: string
    type: string
    createdAt: Date
  }>

  commitments?: Array<{
    id: string
    title: string
    dueDate: Date | null
    status: string
    conflicts?: Array<{
      id: string
      status: string
    }>
  }>
}
