import { ORPCError, os } from '@orpc/server'

export interface ORPCContext {
  user?: { id: string, email: string }
}

export const pub = os.$context<ORPCContext>()

export const authed = pub.use(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError('UNAUTHORIZED')
  }

  return next({
    context: {
      user: context.user,
    },
  })
})
