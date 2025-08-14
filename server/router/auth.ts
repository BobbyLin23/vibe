import { z } from 'zod'
import { pub } from '../utils/orpc'

export const signup = pub.route({
  method: 'POST',
  path: '/auth/signup',
}).input(z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
})).output(z.object({
  id: z.string(),
  email: z.string().email(),
})).handler(async ({ input }) => {
  return {
    id: '123',
    email: input.email,
  }
})
