import { db } from "~~/server/db";
import { fragments, messages } from "~~/server/db/schema";
import {
  agentText,
  createCodingAgent,
  createSandbox,
  killSandbox,
  sandboxUrl,
} from "./agents/coding-agent";
import { codingAgentChannel } from "./channels";
import { inngest } from "./client";
import { codeAgentRunEvent, codingAgentRequested, helloWorldEvent } from "./events";

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    triggers: [helloWorldEvent],
  },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return {
      message: `Hello World! ${event.data.message}`,
    };
  },
);

export const codingAgent = inngest.createFunction(
  {
    id: "coding-agent",
    triggers: [codingAgentRequested],
    // One shared provider budget: cap how many runs can reach DeepSeek per minute.
    throttle: { limit: 30, period: "1m", key: '"deepseek"' },
    onFailure: async ({ event, step }) => {
      await step.realtime.publish(
        "agent-failed",
        codingAgentChannel(event.data.event.data.runId).result,
        {
          status: "failed",
          text: "",
          error: event.data.error.message ?? "The agent run failed",
          files: [],
        },
      );
    },
  },
  async ({ event, step }) => {
    const { runId, prompt } = event.data;
    const channel = codingAgentChannel(runId);
    let progressCount = 0;

    await step.realtime.publish("agent-started", channel.progress, {
      message: "Agent started",
      ts: Date.now(),
    });

    // The sandbox outlives individual tool calls, so its ID is the one piece of run state
    // the tools need; memoizing the step means a retry reconnects to the same machine.
    const sandboxId = await step.run("create-sandbox", async () => {
      const sandbox = await createSandbox();
      return sandbox.sandboxId;
    });

    const { network, files } = createCodingAgent({
      sandboxId,
      onProgress: (message) =>
        step.realtime.publish(`agent-progress-${progressCount++}`, channel.progress, {
          message,
          ts: Date.now(),
        }),
    });

    const result = await network.run(prompt);

    const summary = result.state.data.summary;
    const lastResult = result.state.results.at(-1);

    await step.realtime.publish("agent-result", channel.result, {
      status: "completed",
      text:
        typeof summary === "string" && summary ? summary : lastResult ? agentText(lastResult) : "",
      files: [...files.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([path, content]) => ({ path, content })),
    });

    // Never fail a finished run because cleanup failed — E2B reaps the sandbox on timeout.
    await step.run("kill-sandbox", async () => {
      try {
        await killSandbox(sandboxId);
        return true;
      } catch (error) {
        console.error("Failed to kill sandbox", error);
        return false;
      }
    });

    return { runId };
  },
);

/**
 * Answers one stored user message.
 *
 * The reply is written as an `assistant` message with its fragment, so `messages.getMany`
 * sees a complete conversation rather than only the prompts. Every side effect is a
 * `step.run`, so a retry replays the recorded inserts instead of duplicating rows.
 */
export const codeAgentRun = inngest.createFunction(
  {
    id: "code-agent-run",
    triggers: [codeAgentRunEvent],
    // One shared provider budget: cap how many runs can reach DeepSeek per minute.
    throttle: { limit: 30, period: "1m", key: '"deepseek"' },
    onFailure: async ({ event, step }) => {
      await step.run("record-failure", () =>
        db.insert(messages).values({
          content: event.data.error.message ?? "The agent run failed",
          role: "assistant",
          type: "error",
        }),
      );
    },
  },
  async ({ event, step }) => {
    const { value } = event.data;

    const sandboxId = await step.run("create-sandbox", async () => {
      const sandbox = await createSandbox();
      return sandbox.sandboxId;
    });

    const { network, files } = createCodingAgent({ sandboxId });

    const result = await network.run(value);

    const summary = result.state.data.summary;
    const lastResult = result.state.results.at(-1);

    // Read before teardown: `getHost` needs the sandbox to still exist.
    const url = await step.run("sandbox-url", () => sandboxUrl(sandboxId));

    const text =
      typeof summary === "string" && summary
        ? summary
        : lastResult
          ? agentText(lastResult)
          : "The agent finished without a reply.";

    // A code agent that wrote no files has not delivered anything, so the run is reported
    // as an error and no fragment is recorded.
    const failed = files.size === 0;

    const messageId = await step.run("record-reply", async () => {
      const [message] = await db
        .insert(messages)
        .values(
          failed
            ? {
                content: "Something went wrong. Please try again.",
                role: "assistant",
                type: "error",
              }
            : { content: text, role: "assistant", type: "result" },
        )
        .returning({ id: messages.id });

      if (!message) {
        throw new Error("Failed to insert the assistant message");
      }

      return message.id;
    });

    if (!failed) {
      await step.run("record-fragment", () =>
        db.insert(fragments).values({
          messageId,
          sandboxUrl: url,
          title: "Code agent run",
          files: [...files.entries()]
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([path, content]) => ({ path, content })),
        }),
      );
    }

    // Never fail a finished run because cleanup failed — E2B reaps the sandbox on timeout.
    await step.run("kill-sandbox", async () => {
      try {
        await killSandbox(sandboxId);
        return true;
      } catch (error) {
        console.error("Failed to kill sandbox", error);
        return false;
      }
    });

    return { messageId };
  },
);
