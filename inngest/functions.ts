import { agentText, createCodingAgent } from "./agents/coding-agent";
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

    const { agent, workspace } = createCodingAgent({
      onProgress: (message) =>
        step.realtime.publish(`agent-progress-${progressCount++}`, channel.progress, {
          message,
          ts: Date.now(),
        }),
    });

    const result = await agent.run(prompt, { step, maxIter: 6 });

    await step.realtime.publish("agent-result", channel.result, {
      status: "completed",
      text: agentText(result),
      files: [...workspace.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([path, content]) => ({ path, content })),
    });

    return { runId };
  },
);
