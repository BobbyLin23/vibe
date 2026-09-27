import { createAgent, createTool, openai, type AgentResult } from "@inngest/agent-kit";
import { z } from "zod";
import { env } from "~~/env";

/**
 * DeepSeek's OpenAI-compatible endpoint. `deepseek-flash` is the current name of the
 * V4.1 Flash model; the retired `deepseek-v4-flash` alias resolves to the same model.
 */
const MODEL = "deepseek-flash";

const SYSTEM_PROMPT = `You are a coding agent working in an empty scratch workspace.

You have three tools: write_file, read_file and list_files. The workspace starts empty and is
discarded when the run ends, so create every file the task needs with write_file.

Work in small steps: write the files first, then reply with a short summary of what you wrote
and how to run it. Put code in files — never paste a whole file into the reply.`;

/**
 * Creates one agent per run. The scratch workspace lives in this closure, so two
 * concurrent runs can never see each other's files and a retried run starts clean.
 *
 * Note: AgentKit 0.13.2 only feeds the assistant's own messages back into the next
 * inference of a standalone `agent.run` — tool results are kept on the result and in
 * network state, not sent to the model. Keep tasks to a single write-then-explain pass,
 * or move to a network, if the loop has to observe tool output.
 */
export function createCodingAgent({
  onProgress,
}: {
  /** Called by the tools so the UI can show work as it happens. */
  onProgress?: (message: string) => Promise<unknown>;
} = {}) {
  const workspace = new Map<string, string>();

  const writeFile = createTool({
    name: "write_file",
    description: "Create or overwrite a file in the scratch workspace.",
    parameters: z.object({
      path: z.string().describe("Relative path, e.g. src/weekday.ts"),
      content: z.string().describe("Full file content"),
    }),
    handler: async ({ path, content }) => {
      workspace.set(path, content);
      await onProgress?.(`wrote ${path}`);
      return `wrote ${path} (${content.length} characters)`;
    },
  });

  const readFile = createTool({
    name: "read_file",
    description: "Read a file from the scratch workspace.",
    parameters: z.object({ path: z.string() }),
    handler: async ({ path }) => {
      await onProgress?.(`read ${path}`);
      return workspace.get(path) ?? `error: ${path} does not exist`;
    },
  });

  const listFiles = createTool({
    name: "list_files",
    description: "List every file in the scratch workspace.",
    parameters: z.object({}),
    handler: () => [...workspace.keys()].sort().join("\n") || "(workspace is empty)",
  });

  const agent = createAgent({
    name: "coding-agent",
    description: "Writes code into a scratch workspace, then explains it.",
    system: SYSTEM_PROMPT,
    tools: [writeFile, readFile, listFiles],
    model: openai({
      model: MODEL,
      baseUrl: env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
      apiKey: env.DEEPSEEK_API_KEY,
    }),
  });

  return { agent, workspace };
}

/** Joins the assistant's text messages from one agent iteration. */
export function agentText(result: AgentResult): string {
  return result.output
    .filter((message) => message.type === "text")
    .map((message) =>
      typeof message.content === "string"
        ? message.content
        : message.content.map((part) => part.text).join(""),
    )
    .join("\n\n")
    .trim();
}
