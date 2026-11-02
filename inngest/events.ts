import { eventType } from "inngest";
import { z } from "zod";

/**
 * Single definition of the test event, shared by the trigger (`inngest/functions.ts`)
 * and the sender (`server/router/inngest.ts`), so both sides stay in sync.
 */
export const helloWorldEvent = eventType("test/hello.world", {
  schema: z.object({ message: z.string().min(1) }),
});

/**
 * Starts one coding-agent run. `runId` doubles as the realtime channel ID and the
 * event ID, so a retried send cannot start a second run.
 *
 * `projectId` is optional because the standalone `/agent` demo runs without a project;
 * when it is set, the function saves the assistant's reply as a project message.
 */
export const codingAgentRequested = eventType("agent/coding.requested", {
  schema: z.object({
    runId: z.string().min(1),
    projectId: z.string().min(1).optional(),
    prompt: z.string().min(1),
  }),
});
