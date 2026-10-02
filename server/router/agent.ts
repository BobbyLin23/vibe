import { getSubscriptionToken } from "inngest/realtime";
import { z } from "zod";
import { env } from "~~/env";
import { codingAgentChannel } from "~~/inngest/channels";
import { inngest } from "~~/inngest/client";
import { inngestUnreachable, isConnectionRefused } from "~~/inngest/errors";
import { codingAgentRequested } from "~~/inngest/events";
import { base } from "./base";

/**
 * Starts one coding-agent run.
 *
 * The event ID is the run ID, so a retried send cannot start a second run; the
 * run ID is also the realtime channel the page subscribes to.
 */
export const run = base
  .errors({
    INNGEST_UNREACHABLE: inngestUnreachable,
    MISSING_API_KEY: {
      message: "DEEPSEEK_API_KEY is not set — add it to .env and restart the dev server",
    },
    MISSING_E2B_API_KEY: {
      message: "E2B_API_KEY is not set — add it to .env and restart the dev server",
    },
  })
  .input(z.object({ prompt: z.string().trim().min(1).max(4000) }))
  .output(z.object({ runId: z.string(), ids: z.array(z.string()) }))
  .handler(async ({ input, errors }) => {
    if (!env.DEEPSEEK_API_KEY) {
      throw errors.MISSING_API_KEY();
    }

    if (!env.E2B_API_KEY) {
      throw errors.MISSING_E2B_API_KEY();
    }

    const runId = crypto.randomUUID();

    try {
      const { ids } = await inngest.send(
        codingAgentRequested.create({ runId, prompt: input.prompt }, { id: runId }),
      );

      return { runId, ids };
    } catch (error) {
      if (isConnectionRefused(error)) {
        throw errors.INNGEST_UNREACHABLE();
      }

      throw error;
    }
  });

/**
 * Mints a short-lived subscription token for one run's channel.
 *
 * This app has no authentication; a real app must verify the caller owns the
 * run before handing out a token, since channels are addressable by ID.
 */
export const subscriptionToken = base
  .input(z.object({ runId: z.string().min(1).max(120) }))
  .output(z.object({ key: z.string().optional(), apiBaseUrl: z.string().optional() }))
  .handler(async ({ input }) => {
    const token = await getSubscriptionToken(inngest, {
      channel: codingAgentChannel(input.runId),
      topics: ["progress", "result"],
    });

    return { key: token.key, apiBaseUrl: token.apiBaseUrl };
  });
