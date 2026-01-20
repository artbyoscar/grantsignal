import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import { ZodError } from 'zod'
import type { Context } from './context'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  })
})

export const orgProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.orgId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Organization ID is required',
    })
  }

  // Find the organization by Clerk org ID
  const organization = await ctx.prisma.organization.findUnique({
    where: { clerkOrgId: ctx.orgId },
  })

  if (!organization) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Organization not found',
    })
  }

  // Verify user has access to this organization
  const organizationUser = await ctx.prisma.organizationUser.findUnique({
    where: {
      organizationId_clerkUserId: {
        organizationId: organization.id,
        clerkUserId: ctx.userId,
      },
    },
  })

  if (!organizationUser) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this organization',
    })
  }

  return next({
    ctx: {
      ...ctx,
      organizationId: organization.id,
      organization,
      organizationUser,
    },
  })
})
