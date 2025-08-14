import { desc } from 'drizzle-orm'
import { generateSlug } from 'random-word-slugs'
import { z } from 'zod'
import { db } from '../db'
import { message, project } from '../db/schema'
import { inngest } from '../inngest'
import { pub } from '../utils/orpc'

export const create = pub.route({
  method: 'POST',
  path: '/projects',
}).input(z.object({
  value: z.string().min(1, { message: 'Message is required' }).max(10000, { message: 'Message cannot exceed 10000 characters' }),
})).handler(async ({ input }) => {
  const [newProject] = await db.insert(project).values({
    name: generateSlug(2, {
      format: 'kebab',
    }),
  }).returning()

  await db.insert(message).values({
    projectId: newProject.id,
    content: input.value,
    role: 'user',
    type: 'result',
  })

  await inngest.send({
    name: 'code-agent/run',
    data: {
      value: input.value,
      projectId: newProject.id,
    },
  })

  return newProject
})

export const getMany = pub.route({
  method: 'GET',
  path: '/projects',
}).handler(async () => {
  const projects = await db.select().from(project).orderBy(desc(project.updatedAt))
  return projects
})
