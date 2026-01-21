import { router } from '../trpc'
import { organizationsRouter } from './organizations'
import { grantsRouter } from './grants'
import { programsRouter } from './programs'
import { documentsRouter } from './documents'
import { complianceRouter } from './compliance'
import { reportsRouter } from './reports'
import { aiRouter } from './ai'
import { writingRouter } from './writing'

/**
 * Main tRPC router combining all sub-routers
 */
export const appRouter = router({
  organizations: organizationsRouter,
  grants: grantsRouter,
  programs: programsRouter,
  documents: documentsRouter,
  compliance: complianceRouter,
  reports: reportsRouter,
  ai: aiRouter,
  writing: writingRouter,
})

export type AppRouter = typeof appRouter
