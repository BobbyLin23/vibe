import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const messageType = pgEnum("message_type", ["result", "error"]);
export const messageRole = pgEnum("message_role", ["user", "assistant"]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  content: text("content").notNull(),
  role: messageRole("role").notNull(),
  type: messageType("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    // Mirrors Prisma's `@updatedAt`: a later write moves the row to the top of `getMany`.
    .$onUpdate(() => new Date()),
});

export const fragments = pgTable("fragments", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Unique, so a message owns at most one fragment: reading a message's output is a
  // one-row lookup rather than a list the caller has to pick from.
  messageId: uuid("message_id")
    .notNull()
    .unique()
    .references(() => messages.id, { onDelete: "cascade" }),
  sandboxUrl: text("sandbox_url").notNull(),
  title: text("title").notNull(),
  files: jsonb("files").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
