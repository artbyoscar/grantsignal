import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts?: { headers?: Headers }) {
  const { userId, orgId } = await auth()

  return {
    prisma,
    userId,
    orgId,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
