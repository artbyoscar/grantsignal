/**
 * Client-safe types for GrantSignal
 *
 * These types match the actual API responses and are safe to use in client components.
 * DO NOT import from @prisma/client in client components - use these types instead.
 */

import type { AppRouter } from '@/server/routers/_app'
import type { inferRouterOutputs } from '@trpc/server'

type RouterOutput = inferRouterOutputs<AppRouter>

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
 * This is inferred directly from the tRPC router output to ensure type safety.
 * Superjson automatically transforms Prisma Decimal to number.
 */
export type Grant = RouterOutput['grants']['list']['grants'][number]

/**
 * Grant type as returned by api.grants.byId
 *
 * This includes full details with fit scores, documents, and commitments.
 */
export type GrantWithDetails = RouterOutput['grants']['byId']
