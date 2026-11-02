import { eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { messages, projects } from "~~/server/db/schema";
import { agentText, createCodingAgent, createSandbox, killSandbox } from "./agents/coding-agent";
import { codingAgentChannel } from "./channels";
import { inngest } from "./client";
import { codingAgentRequested, helloWorldEvent } from "./events";

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
      const { runId, projectId } = event.data.event.data;
      const errorMessage = event.data.error.message ?? "The agent run failed";

      await step.realtime.publish("agent-failed", codingAgentChannel(runId).result, {
        status: "failed",
        text: "",
        error: errorMessage,
        files: [],
      });

      if (projectId) {
        await step.run("save-failed-message", async () => {
          await db.insert(messages).values({
            projectId,
            content: errorMessage,
            role: "assistant",
            type: "error",
          });

          await db
            .update(projects)
            .set({ updatedAt: new Date() })
            .where(eq(projects.id, projectId));
        });
      }
    },
  },
  async ({ event, step }) => {
    const { runId, projectId, prompt } = event.data;
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
    const text =
      typeof summary === "string" && summary ? summary : lastResult ? agentText(lastResult) : "";

    await step.realtime.publish("agent-result", channel.result, {
      status: "completed",
      text,
      files: [...files.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([path, content]) => ({ path, content })),
    });

    // Project runs keep the conversation: the prompt was saved by `projects.create`,
    // so store the assistant's reply too. `/agent` demo runs have no project to save to.
    if (projectId) {
      await step.run("save-result-message", async () => {
        await db.insert(messages).values({
          projectId,
          content: text,
          role: "assistant",
          type: "result",
        });

        await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
      });
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

    return { runId };
  },
);
