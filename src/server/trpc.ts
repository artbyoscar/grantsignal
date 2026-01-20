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
  console.log('[protectedProcedure] ctx.auth:', ctx.auth)

  if (!ctx.auth?.userId) {
    console.log('[protectedProcedure] No userId - throwing UNAUTHORIZED')
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    })
  }

  return next({
    ctx: {
      ...ctx,
      auth: ctx.auth,
    },
  })
})

const enforceOrg = t.middleware(async ({ ctx, next }) => {
  console.log('[orgProcedure] ctx.auth:', ctx.auth)
  console.log('[orgProcedure] ctx.organizationId:', ctx.organizationId)

  if (!ctx.auth?.userId) {
    console.log('[orgProcedure] No userId - throwing UNAUTHORIZED')
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (!ctx.organizationId) {
    console.log('[orgProcedure] No organizationId - throwing FORBIDDEN')
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Organization required'
    })
  }

  console.log('[orgProcedure] ✅ All checks passed, proceeding with organizationId:', ctx.organizationId)

  return next({
    ctx: {
      ...ctx,
      auth: ctx.auth,
      organizationId: ctx.organizationId,
    },
  })
})

export const orgProcedure = protectedProcedure.use(enforceOrg)
