import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { inngest } from "~~/inngest/client";
import { inngestUnreachable, isConnectionRefused } from "~~/inngest/errors";
import { codeAgentRunEvent } from "~~/inngest/events";
import { db } from "~~/server/db";
import { messages } from "~~/server/db/schema";
import { base } from "./base";

const message = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(["user", "assistant"]),
  type: z.enum(["result", "error"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Every message, newest first, so the page can render a conversation as it happened.
 *
 * Fragments are not included: a message's output is fetched with its own page, and the
 * list stays one query as the table grows.
 */
export const getMany = base
  .output(z.array(message))
  .handler(() =>
    db.select().from(messages).orderBy(desc(messages.updatedAt), desc(messages.createdAt)),
  );

/**
 * Stores a user prompt and asks the `code-agent-run` function to answer it.
 *
 * The event ID is the row ID, so a retried send cannot start two runs for one prompt;
 * the function writes the assistant reply as its own row.
 *
 * The prompt is deleted if the event cannot be sent: a stored prompt with no event behind
 * it would sit in the conversation forever waiting for a reply that was never requested.
 */
export const create = base
  .errors({ INNGEST_UNREACHABLE: inngestUnreachable })
  .input(z.object({ value: z.string().trim().min(1).max(4000) }))
  .output(message)
  .handler(async ({ input, errors }) => {
    const [created] = await db
      .insert(messages)
      .values({ content: input.value, role: "user", type: "result" })
      .returning();

    if (!created) {
      throw new Error("Failed to insert the message");
    }

    try {
      await inngest.send(
        codeAgentRunEvent.create({ value: input.value, messageId: created.id }, { id: created.id }),
      );
    } catch (error) {
      await db.delete(messages).where(eq(messages.id, created.id));

      if (isConnectionRefused(error)) {
        throw errors.INNGEST_UNREACHABLE();
      }

      throw error;
    }

    return created;
  });
