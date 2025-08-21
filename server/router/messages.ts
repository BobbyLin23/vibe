import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { fragment, message } from '../db/schema'
import { inngest } from '../inngest'
import { pub } from '../utils/orpc'

export const create = pub.route({
  method: 'POST',
  path: '/messages',
}).input(z.object({
  value: z.string().min(1, { message: 'Message is required' }).max(10000, { message: 'Message cannot exceed 10000 characters' }),
  projectId: z.string().min(1, { message: 'Project ID is required' }),
})).handler(async ({ input }) => {
  const [newMessage] = await db.insert(message).values({
    content: input.value,
    role: 'user',
    type: 'result',
    projectId: input.projectId,
  }).returning()

  await inngest.send({
    name: 'code-agent/run',
    data: {
      value: input.value,
      projectId: input.projectId,
    },
  })

  return newMessage
})

export const getMany = pub.route({
  method: 'GET',
  path: '/messages',
}).input(
  z.object({
    projectId: z.string().min(1, { message: 'Project ID is required' }),
  }),
).handler(async ({ input }) => {
  const messages = await db.select()
    .from(message)
    .where(eq(message.projectId, input.projectId))
    .orderBy(desc(message.updatedAt))
    .leftJoin(fragment, eq(message.id, fragment.messageId))

  return messages
})
