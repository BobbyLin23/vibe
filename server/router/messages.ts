import { z } from "zod";
import { inngestUnreachable, isConnectionRefused } from "~~/inngest/errors";
import { codingAgentRequested } from "~~/inngest/events";
import { inngest } from "~~/inngest/client";
import { db } from "~~/server/db";
import { messages } from "~~/server/db/schema";
import { base } from "./base";

const fragmentSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  sandboxUrl: z.string(),
  title: z.string(),
  files: z.unknown(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const messageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  content: z.string(),
  role: z.enum(["user", "assistant"]),
  type: z.enum(["result", "error"]),
  createdAt: z.date(),
  updatedAt: z.date(),
  /** The latest fragment for this message, or `null` before the agent produces one. */
  fragment: fragmentSchema.nullable(),
});

/** Oldest first: a conversation reads top to bottom. */
export const getMany = base
  .input(z.object({ projectId: z.string().min(1, { message: "Project ID is required" }) }))
  .output(z.array(messageSchema))
  .handler(async ({ input }) => {
    const rows = await db.query.messages.findMany({
      where: { projectId: input.projectId },
      with: {
        fragments: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "asc" },
    });

    return rows.map(({ fragments, ...message }) => ({
      ...message,
      fragment: fragments[0] ?? null,
    }));
  });

/**
 * Adds a user message to a project and starts the coding agent for it.
 *
 * As in `projects.create`, the event ID is the run ID, so a retried send cannot
 * start a second run.
 */
export const create = base
  .errors({ INNGEST_UNREACHABLE: inngestUnreachable })
  .input(
    z.object({
      value: z
        .string()
        .trim()
        .min(1, { message: "Value is required" })
        .max(10000, { message: "Value is too long" }),
      projectId: z.string().min(1, { message: "Project ID is required" }),
    }),
  )
  .output(
    z.object({
      id: z.string(),
      projectId: z.string(),
      content: z.string(),
      role: z.enum(["user", "assistant"]),
      type: z.enum(["result", "error"]),
      createdAt: z.date(),
      updatedAt: z.date(),
    }),
  )
  .handler(async ({ input, errors }) => {
    const runId = crypto.randomUUID();

    const [createdMessage] = await db
      .insert(messages)
      .values({
        projectId: input.projectId,
        content: input.value,
        role: "user",
        type: "result",
      })
      .returning();

    if (!createdMessage) {
      throw new Error("Failed to create message");
    }

    try {
      await inngest.send(
        codingAgentRequested.create(
          { runId, projectId: input.projectId, prompt: input.value },
          { id: runId },
        ),
      );
    } catch (error) {
      if (isConnectionRefused(error)) {
        throw errors.INNGEST_UNREACHABLE();
      }

      throw error;
    }

    return createdMessage;
  });
