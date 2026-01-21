import { router } from '../trpc'
import { organizationsRouter } from './organizations'
import { grantsRouter } from './grants'
import { programsRouter } from './programs'
import { documentsRouter } from './documents'
import { complianceRouter } from './compliance'
import { discoveryRouter } from './discovery'
import { aiRouter } from './ai'

/**
 * Main tRPC router combining all sub-routers
 */
export const appRouter = router({
  organizations: organizationsRouter,
  grants: grantsRouter,
  programs: programsRouter,
  documents: documentsRouter,
  compliance: complianceRouter,
  discovery: discoveryRouter,
  ai: aiRouter,
})

export type AppRouter = typeof appRouter
