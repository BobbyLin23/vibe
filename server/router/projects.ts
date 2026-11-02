import { desc, eq } from "drizzle-orm";
import { generateSlug } from "random-word-slugs";
import { z } from "zod";
import { inngest } from "~~/inngest/client";
import { inngestUnreachable, isConnectionRefused } from "~~/inngest/errors";
import { codingAgentRequested } from "~~/inngest/events";
import { db } from "~~/server/db";
import { messages, projects } from "~~/server/db/schema";
import { base } from "./base";

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Newest activity first: every message bumps the project's `updatedAt`. */
export const getMany = base.output(z.array(projectSchema)).handler(async () => {
  return db.select().from(projects).orderBy(desc(projects.updatedAt));
});

export const getOne = base
  .errors({ NOT_FOUND: { message: "Project not found" } })
  .input(z.object({ id: z.string().min(1, { message: "Id is required" }) }))
  .output(projectSchema)
  .handler(async ({ input, errors }) => {
    const [project] = await db.select().from(projects).where(eq(projects.id, input.id));

    if (!project) {
      throw errors.NOT_FOUND();
    }

    return project;
  });

/**
 * Creates a project from the first prompt, stores that prompt as its first message,
 * and starts the coding agent for it.
 *
 * The event ID is the run ID, so a retried send cannot start a second run; the run ID
 * also identifies the realtime channel the client can subscribe to.
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
    }),
  )
  .output(projectSchema.extend({ runId: z.string() }))
  .handler(async ({ input, errors }) => {
    const runId = crypto.randomUUID();

    // `neon-http` has no transactions, so project and message are two statements;
    // the project name is generated here rather than in the database.
    const [project] = await db
      .insert(projects)
      .values({ name: generateSlug(2, { format: "kebab" }) })
      .returning();

    if (!project) {
      throw new Error("Failed to create project");
    }

    await db.insert(messages).values({
      projectId: project.id,
      content: input.value,
      role: "user",
      type: "result",
    });

    try {
      await inngest.send(
        codingAgentRequested.create(
          { runId, projectId: project.id, prompt: input.value },
          { id: runId },
        ),
      );
    } catch (error) {
      if (isConnectionRefused(error)) {
        throw errors.INNGEST_UNREACHABLE();
      }

      throw error;
    }

    return { ...project, runId };
  });
