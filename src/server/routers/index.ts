import { router } from '../trpc'
import { organizationsRouter } from './organizations'
import { grantsRouter } from './grants'
import { programsRouter } from './programs'
import { documentsRouter } from './documents'
import { complianceRouter } from './compliance'
import { discoveryRouter } from './discovery'
import { aiRouter } from './ai'
import { writingRouter } from './writing'
import { onboardingRouter } from './onboarding'
import { reportsRouter } from './reports'
import { fundersRouter } from './funders'
import { voiceRouter } from './voice'
import { teamRouter } from './team'

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
  writing: writingRouter,
  onboarding: onboardingRouter,
  reports: reportsRouter,
  funders: fundersRouter,
  voice: voiceRouter,
  team: teamRouter,
})

export type AppRouter = typeof appRouter
