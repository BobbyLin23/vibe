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
 */
export const codingAgentRequested = eventType("agent/coding.requested", {
  schema: z.object({
    runId: z.string().min(1),
    prompt: z.string().min(1),
  }),
});

/**
 * Answers one stored user message: the `code-agent-run` function runs the coding agent and
 * records the assistant reply. `messageId` is the user message the run answers, and is also
 * the event ID, so a retried send cannot start a second run for the same message.
 */
export const codeAgentRunEvent = eventType("code-agent/run", {
  schema: z.object({
    value: z.string().min(1),
    messageId: z.string().min(1),
  }),
});
