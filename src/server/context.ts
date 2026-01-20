import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts?: { headers?: Headers }) {
  const { userId } = await auth()

  let organizationId: string | null = null

  if (userId) {
    const membership = await prisma.organizationUser.findFirst({
      where: { clerkUserId: userId },
      select: { organizationId: true },
    })
    organizationId = membership?.organizationId ?? null
  }

  return {
    auth: { userId },
    organizationId,
    db: prisma,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
