import { channel } from "inngest/realtime";
import { z } from "zod";

/**
 * Per-run channel: `agent.run` hands the run ID to the browser, which subscribes to
 * `coding-agent:<runId>` and renders progress while the durable function works.
 */
export const codingAgentChannel = channel({
  name: (runId: string) => `coding-agent:${runId}`,
  topics: {
    progress: {
      schema: z.object({ message: z.string(), ts: z.number() }),
    },
    result: {
      schema: z.object({
        status: z.enum(["completed", "failed"]),
        text: z.string(),
        error: z.string().optional(),
        files: z.array(z.object({ path: z.string(), content: z.string() })),
      }),
    },
  },
});
