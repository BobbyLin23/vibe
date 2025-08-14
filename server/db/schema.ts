import { json, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const project = pgTable('project', {
  id: uuid().primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
})

export const messageRole = pgEnum('message_role', ['user', 'assistant'])

export const messageType = pgEnum('message_type', ['result', 'error'])

export const message = pgTable('message', {
  id: uuid('id').primaryKey().defaultRandom(),
  content: text('content').notNull(),
  role: messageRole('role').notNull(),
  type: messageType('type').notNull(),
  projectId: uuid('project_id').notNull().references(() => project.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
})

export const fragment = pgTable('fragment', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => message.id, { onDelete: 'cascade' }),
  sandboxUrl: text('sandbox_url').notNull(),
  title: text('title').notNull(),
  files: json('files').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$onUpdate(() => new Date()),
})
