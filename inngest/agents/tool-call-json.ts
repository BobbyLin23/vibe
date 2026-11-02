import { AgenticModel } from "@inngest/agent-kit";

type ChatCompletionLike = {
  choices?: {
    message?: {
      tool_calls?: { function?: { arguments?: string } }[];
    };
  }[];
};

/**
 * Escapes double quotes that appear unescaped inside a JSON string.
 *
 * DeepSeek occasionally emits tool-call arguments like
 * `{"content": "<meta content="width=device-width, initial-scale=1" />"}`: the closing
 * quote of an HTML attribute terminates the JSON string, so the whole call is invalid.
 * A proper parser cannot recover from that, but the intent is unambiguous: a quote is a
 * string terminator only when the next significant character is `,`, `}`, `]` or `:`.
 * Anything else means the model forgot the backslash.
 */
export function escapeUnescapedQuotes(json: string): string {
  let output = "";
  let inString = false;

  for (let index = 0; index < json.length; index++) {
    const character = json[index]!;

    if (!inString) {
      output += character;
      if (character === '"') inString = true;
      continue;
    }

    if (character === "\\") {
      output += character;
      if (index + 1 < json.length) output += json[++index];
      continue;
    }

    if (character !== '"') {
      output += character;
      continue;
    }

    let nextIndex = index + 1;
    while (nextIndex < json.length && /\s/.test(json[nextIndex]!)) nextIndex++;

    const next = json[nextIndex];

    if (next === undefined || next === "," || next === "}" || next === "]" || next === ":") {
      output += character;
      inString = false;
    } else {
      output += '\\"';
    }
  }

  return output;
}

/**
 * Rewrites invalid tool-call arguments in place before AgentKit parses them.
 *
 * The raw model response is memoized by `step.ai.infer`, so a retry replays the same
 * broken payload; repairing it here is the only way to keep the run alive.
 */
export function repairToolCallArguments(response: unknown) {
  const choices = (response as ChatCompletionLike | undefined)?.choices;

  if (!Array.isArray(choices)) return;

  for (const choice of choices) {
    for (const toolCall of choice.message?.tool_calls ?? []) {
      const args = toolCall.function?.arguments;

      if (typeof args !== "string") continue;

      // Mirror AgentKit's own normalization so we only touch calls it would reject.
      const normalized = args.replace(/^["']|["']$/g, "");

      try {
        JSON.parse(normalized);
        continue;
      } catch {
        // Fall through and try to repair it.
      }

      const repaired = escapeUnescapedQuotes(normalized);

      try {
        JSON.parse(repaired);
        toolCall.function!.arguments = repaired;
      } catch {
        // Leave the original untouched; AgentKit reports the parse failure.
      }
    }
  }
}

type AnyAgenticModel = AgenticModel<any>;
type InferArgs = Parameters<AnyAgenticModel["infer"]>;

const PATCHED = Symbol.for("vibe.agent-kit.response-parser-patch");
const modelPrototype = AgenticModel.prototype as AnyAgenticModel;
const patchedPrototype = modelPrototype as AnyAgenticModel & Record<symbol, unknown>;

/**
 * Wraps `AgenticModel.infer` so {@link repairToolCallArguments} runs before AgentKit's
 * parser throws on DeepSeek's malformed tool-call JSON.
 *
 * AgentKit builds the `AgenticModel` and its parser internally, so there is no per-model
 * response hook. The guard keeps HMR re-evaluations from stacking wrappers.
 */
export function installToolCallJsonRepair() {
  if (patchedPrototype[PATCHED]) return;

  patchedPrototype[PATCHED] = true;

  const infer = modelPrototype.infer;

  modelPrototype.infer = async function (this: AnyAgenticModel, ...args: InferArgs) {
    const parseResponse = this.responseParser;

    this.responseParser = (response) => {
      repairToolCallArguments(response);
      return parseResponse(response);
    };

    try {
      return await infer.apply(this, args);
    } finally {
      this.responseParser = parseResponse;
    }
  };
}
