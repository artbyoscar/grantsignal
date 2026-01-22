import { cache } from 'react'
import { appRouter } from '@/server/routers/_app'
import { createContext } from '@/server/context'

/**
 * Server-side tRPC API caller for Next.js Server Components
 * Uses React cache() to deduplicate requests within a single render
 */
export const api = cache(async () => {
  const context = await createContext()
  return appRouter.createCaller(context)
})
