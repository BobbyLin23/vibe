import type { fragment, messageRole, messageType } from '~~/server/db/schema'

export type MessageRole = (typeof messageRole.enumValues)[number]
export type MessageType = (typeof messageType.enumValues)[number]

export type Fragment = typeof fragment.$inferSelect
