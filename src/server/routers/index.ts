import { router } from '../trpc'
import { organizationsRouter } from './organizations'
import { grantsRouter } from './grants'
import { documentsRouter } from './documents'
import { complianceRouter } from './compliance'

/**
 * Main tRPC router combining all sub-routers
 */
export const appRouter = router({
  organizations: organizationsRouter,
  grants: grantsRouter,
  documents: documentsRouter,
  compliance: complianceRouter,
})

export type AppRouter = typeof appRouter
