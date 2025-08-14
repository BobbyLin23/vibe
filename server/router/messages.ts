import { asc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { message } from '../db/schema'
import { inngest } from '../inngest'

export const create = pub.route({
  method: 'POST',
  path: '/messages',
}).input(z.object({
  value: z.string().min(1, { message: 'Message is required' }),
})).handler(async ({ input }) => {
  const [newMessage] = await db.insert(message).values({
    content: input.value,
    role: 'user',
    type: 'result',
  }).returning()

  await inngest.send({
    name: 'code-agent/run',
    data: {
      value: input.value,
    },
  })

  return newMessage
})

export const getMany = pub.route({
  method: 'GET',
  path: '/messages',
}).handler(async () => {
  const messages = await db.select().from(message).orderBy(asc(message.updatedAt))
  return messages
})
