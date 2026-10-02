import { createRequire } from "node:module";
import type * as E2B from "@e2b/code-interpreter";
import {
  createAgent,
  createNetwork,
  createTool,
  openai,
  type AgentResult,
} from "@inngest/agent-kit";
import type { GetStepTools, Inngest } from "inngest";
import { z } from "zod";
import { env } from "~~/env";

/**
 * DeepSeek's OpenAI-compatible endpoint. `deepseek-flash` is the current name of the
 * V4.1 Flash model; the retired `deepseek-v4-flash` alias resolves to the same model.
 */
const MODEL = "deepseek-flash";

/**
 * How long E2B keeps the sandbox alive after the last call. The run has to finish inside
 * this window, and E2B resumes a sandbox that was paused, so replays keep the same machine.
 */
const SANDBOX_TIMEOUT_MS = 10 * 60_000;

/** Model rounds one network run may take before it stops scheduling the agent. */
const MAX_ITER = 15;

const SYSTEM_PROMPT = `You are a coding agent working in an E2B sandbox: a Linux workspace
that you own for the duration of the run.

Tools:
- createOrUpdateFiles: create or overwrite files. Always send the full file content.
- readFiles: read files back.
- terminal: run a shell command and read its output. Commands run to completion, so
  never start a server or another long-running process.

Work in small steps: write the files first, then use terminal to run and check them.
Finish every reply with <task_summary>a short summary of what you did and how to run it
</task_summary>. Put code in files — never paste a whole file into the reply.`;

/**
 * Loads the E2B SDK through Node's resolver instead of a static import.
 *
 * E2B publishes CommonJS whose module scope requires the ESM-only `chalk`. When a bundler
 * inlines that graph — Nuxt's dev entry, Nitro's route chunks — it rewrites the require to
 * `chalk.default`, which is the module namespace rather than chalk itself, and the server dies
 * before serving a request with `chalk.default.red is not a function`. A runtime require keeps
 * E2B out of the bundle and leaves the CJS/ESM interop to Node.
 */
function e2b(): typeof E2B {
  return createRequire(import.meta.url)("@e2b/code-interpreter");
}

/** Creates the sandbox a run works in. Called inside a `step.run`, so a retry reuses it. */
export function createSandbox(): Promise<E2B.Sandbox> {
  const { Sandbox } = e2b();
  const opts = { apiKey: env.E2B_API_KEY, timeoutMs: SANDBOX_TIMEOUT_MS };

  return env.E2B_TEMPLATE ? Sandbox.create(env.E2B_TEMPLATE, opts) : Sandbox.create(opts);
}

/**
 * Reconnects to an existing sandbox. Tool handlers have no state of their own, and a
 * replayed step may run in a different process, so every call connects from the ID.
 */
function connectSandbox(sandboxId: string) {
  const { Sandbox } = e2b();

  return Sandbox.connect(sandboxId, { apiKey: env.E2B_API_KEY, timeoutMs: SANDBOX_TIMEOUT_MS });
}

/** Best-effort teardown so a finished run stops paying for sandbox seconds. */
export function killSandbox(sandboxId: string) {
  const { Sandbox } = e2b();

  return Sandbox.kill(sandboxId, { apiKey: env.E2B_API_KEY });
}

/**
 * Runs one tool call inside a memoized step when Inngest step tools are available, so a
 * retry replays the recorded output instead of repeating the sandbox work. Outside an
 * Inngest context there is no step and the call runs inline.
 */
function runStep<T>(
  step: GetStepTools<Inngest.Any> | undefined,
  id: string,
  run: () => Promise<T>,
) {
  // `step.run` returns the JSON-safe form of the value, so let its type flow through.
  return step ? step.run(id, run) : run();
}

/**
 * Creates one agent per run, wired to a sandbox created by the caller.
 *
 * The agent runs in a network rather than on its own: a standalone `agent.run` feeds only
 * the assistant's own messages back into the next inference, while a network appends every
 * tool result to the shared history — without that the model never sees what `terminal` or
 * `readFiles` returned and the loop is stuck at one write-then-explain pass.
 *
 * `files` collects everything written through `createOrUpdateFiles`, in the shape the
 * realtime result topic expects; files created by a shell command are not tracked.
 */
export function createCodingAgent({
  sandboxId,
  onProgress,
}: {
  /** Sandbox created with {@link createSandbox}; tools reconnect to it by ID. */
  sandboxId: string;
  /** Called by the tools so the UI can show work as it happens. */
  onProgress?: (message: string) => Promise<unknown>;
}) {
  const files = new Map<string, string>();

  /** Step IDs have to be unique per run, so every tool call gets its own counter. */
  let stepCount = 0;

  const terminal = createTool({
    name: "terminal",
    description:
      "Run a shell command in the sandbox and return its output. Commands run to completion, so never start a server or another long-running process.",
    parameters: z.object({
      command: z.string().describe("Shell command, e.g. `npm test`"),
    }),
    handler: async ({ command }, { step }) => {
      const output = await runStep(step, `terminal-${stepCount++}`, async () => {
        const { CommandExitError } = e2b();
        const sandbox = await connectSandbox(sandboxId);

        try {
          const result = await sandbox.commands.run(command);

          return result.stdout + (result.stderr ? `\n[stderr]\n${result.stderr}` : "");
        } catch (error) {
          // A non-zero exit is data for the model, not a broken tool call.
          if (error instanceof CommandExitError) {
            return `exit code ${error.exitCode}${error.error ? ` (${error.error})` : ""}\n${
              error.stdout
            }${error.stderr ? `\n[stderr]\n${error.stderr}` : ""}`;
          }

          return `command failed: ${error instanceof Error ? error.message : String(error)}`;
        }
      });

      await onProgress?.(`$ ${command}`);

      return output.trim() || "(no output)";
    },
  });

  const createOrUpdateFiles = createTool({
    name: "createOrUpdateFiles",
    description: "Create or overwrite files in the sandbox. Always send the full file content.",
    parameters: z.object({
      files: z.array(
        z.object({
          path: z.string().describe("Path inside the sandbox, e.g. src/weekday.ts"),
          content: z.string().describe("Full file content"),
        }),
      ),
    }),
    handler: async ({ files: batch }, { step }) => {
      const written = await runStep(step, `create-or-update-files-${stepCount++}`, async () => {
        const sandbox = await connectSandbox(sandboxId);

        for (const file of batch) {
          await sandbox.files.write(file.path, file.content);
        }

        return batch.map((file) => file.path);
      });

      // Recorded outside the step: a replayed step returns the paths without touching the
      // sandbox, and the result payload still lists every file the run wrote.
      for (const file of batch) {
        files.set(file.path, file.content);
      }

      await onProgress?.(`wrote ${written.join(", ")}`);

      return `wrote ${written.join(", ")}`;
    },
  });

  const readFiles = createTool({
    name: "readFiles",
    description: "Read files from the sandbox.",
    parameters: z.object({ files: z.array(z.string()) }),
    handler: async ({ files: paths }, { step }) => {
      const contents = await runStep(step, `read-files-${stepCount++}`, async () => {
        const sandbox = await connectSandbox(sandboxId);
        const read: { path: string; content?: string; error?: string }[] = [];

        for (const path of paths) {
          try {
            read.push({ path, content: await sandbox.files.read(path) });
          } catch (error) {
            // One missing file should not hide the ones that do exist.
            read.push({ path, error: error instanceof Error ? error.message : String(error) });
          }
        }

        return read;
      });

      await onProgress?.(`read ${paths.join(", ")}`);

      return JSON.stringify(contents);
    },
  });

  const agent = createAgent({
    name: "coding-agent",
    description: "Writes and runs code in an E2B sandbox, then explains it.",
    system: SYSTEM_PROMPT,
    tools: [terminal, createOrUpdateFiles, readFiles],
    model: openai({
      model: MODEL,
      baseUrl: env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
      apiKey: env.DEEPSEEK_API_KEY,
    }),
    lifecycle: {
      onResponse: async ({ result, network }) => {
        const text = agentText(result);

        // The router stops on this marker, so the run does not spend further rounds once
        // the agent has answered; the marker is kept in the summary the UI renders.
        if (network && text.includes("<task_summary>")) {
          network.state.data.summary = text;
        }

        return result;
      },
    },
  });

  const network = createNetwork({
    name: "coding-agent-network",
    agents: [agent],
    maxIter: MAX_ITER,
    router: ({ network, lastResult }) => {
      if (network.state.data.summary) {
        return undefined;
      }

      // Nothing left to do when the last round called no tool at all.
      if (lastResult && !lastResult.output.some((message) => message.type === "tool_call")) {
        return undefined;
      }

      return agent;
    },
  });

  return { network, files };
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
