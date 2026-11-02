import { eq } from "drizzle-orm";
import { db } from "~~/server/db";
import { fragments, messages, projects } from "~~/server/db/schema";
import {
  agentText,
  createCodingAgent,
  createSandbox,
  getPreviewUrl,
  isToolCallParseError,
  killSandbox,
} from "./agents/coding-agent";
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

    let result: Awaited<ReturnType<typeof network.run>> | undefined;

    try {
      result = await network.run(prompt);
    } catch (error) {
      if (!isToolCallParseError(error)) throw error;

      // The model response is memoized in an AI step, so an Inngest retry would replay the
      // same broken tool call and fail identically. End the run instead of retrying for
      // minutes; the code below publishes and saves the failure.
      console.error("Coding agent returned an unparseable tool call", error);
    }

    const summary = result?.state.data.summary;
    const lastResult = result?.state.results.at(-1);
    const text =
      typeof summary === "string" && summary ? summary : lastResult ? agentText(lastResult) : "";

    // As in the course: a run with no summary or no files did not build anything worth
    // previewing, even if the network returned.
    const isError = !result || typeof summary !== "string" || !summary || files.size === 0;
    const failureText = "Something went wrong. Please try again.";

    // The preview URL points at a live sandbox, so it is only minted for successful runs.
    const sandboxUrl = isError
      ? null
      : await step.run("preview-url", () => getPreviewUrl(sandboxId));

    await step.realtime.publish("agent-result", channel.result, {
      status: isError ? "failed" : "completed",
      text: isError ? "" : text,
      error: isError ? failureText : undefined,
      files: [...files.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([path, content]) => ({ path, content })),
    });

    // Project runs keep the conversation: the prompt was saved by `projects.create`, so
    // store the assistant's reply and, on success, the fragment the preview pane renders.
    // `/agent` demo runs have no project to save to.
    if (projectId) {
      await step.run("save-result-message", async () => {
        if (sandboxUrl) {
          const [message] = await db
            .insert(messages)
            .values({
              projectId,
              content: text,
              role: "assistant",
              type: "result",
            })
            .returning();

          if (message) {
            await db.insert(fragments).values({
              messageId: message.id,
              sandboxUrl,
              title: "Fragment",
              files: Object.fromEntries(files),
            });
          }
        } else {
          await db.insert(messages).values({
            projectId,
            content: failureText,
            role: "assistant",
            type: "error",
          });
        }

        await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, projectId));
      });
    }

    // A successful run's preview URL points at the sandbox, so keep it alive until E2B
    // times it out. Failed runs have nothing to preview and are torn down immediately.
    // Never fail a finished run because cleanup failed.
    if (isError) {
      await step.run("kill-sandbox", async () => {
        try {
          await killSandbox(sandboxId);
          return true;
        } catch (error) {
          console.error("Failed to kill sandbox", error);
          return false;
        }
      });
    }

    return { runId };
  },
);
