# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is pnpm (pinned to `pnpm@12.15.0` via `packageManager`).

```bash
pnpm install
pnpm dev              # Nuxt dev server on http://localhost:3012
pnpm dev:inngest      # Inngest dev server on http://localhost:8288 (needed for /inngest and /agent)
pnpm build            # nuxt build
pnpm preview
pnpm generate         # nuxt generate

pnpm lint             # oxlint
pnpm lint:fix         # oxlint --fix
pnpm fmt              # oxfmt
pnpm fmt:check        # oxfmt --check

pnpm db:push          # drizzle-kit push — applies server/db/schema.ts to $DATABASE_URL
pnpm db:studio        # drizzle-kit studio
```

There is no test script or test runner in this repo — do not assume `pnpm test` exists.

Linting/formatting is **oxlint + oxfmt**, not ESLint/Prettier/Biome. Both editors in `.vscode`/`.zed` are wired to the oxc formatter; match the existing formatting rather than adding other tools.

`pnpm exec inngest-cli` fails (`SyntaxError`) because pnpm wraps the native binary with `node`; that is why `dev:inngest` calls `node_modules/inngest-cli/bin/inngest` directly, and why `inngest-cli` appears under `allowBuilds` in `pnpm-workspace.yaml`.

## Environment

`.env` is validated at startup by `env.ts` (`@t3-oss/env-nuxt` + Zod). `nuxt.config.ts` must keep `import "./env";` as its first statement — `drizzle.config.ts` and server code import `env` directly, so the Nuxt config is what loads `.env` for CLI tools.

- `DATABASE_URL` — required (`z.url()`), used by `server/db/index.ts` and `drizzle.config.ts`.
- `INNGEST_DEV=1` — required locally; Inngest v4 otherwise defaults to Cloud mode. Production needs `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.
- `DEEPSEEK_API_KEY`, `E2B_API_KEY` — optional in the schema, but `agent.run` throws typed `MISSING_API_KEY` / `MISSING_E2B_API_KEY` errors without them.
- `DEEPSEEK_BASE_URL`, `E2B_TEMPLATE` — optional overrides (OpenAI-compatible gateway / custom sandbox template).

Changing `.env` requires restarting the dev server (env is read once at startup).

## Architecture

Nuxt 4 app: application code in `app/`, Nitro server code in `server/`, background work in `inngest/`. The three layers connect through oRPC (typed RPC) and Inngest (durable functions + realtime).

### oRPC is the API layer

Procedures are the entire backend surface; there are no hand-written REST endpoints except the Inngest handler.

- [server/router/base.ts](server/router/base.ts) — shared `os.$context<{ headers?: Headers }>()` builder. Every procedure extends it.
- `server/router/<domain>.ts` — procedures (`hello.ts`, `inngest.ts`, `agent.ts`). Each declares `.input(zod)`, `.output(zod)`, typed `.errors({ CODE: ... })`, then `.handler`. Handlers throw `errors.CODE()` so the client receives a typed error code.
- [server/router/index.ts](server/router/index.ts) — manually assembled nested router (`{ agent, hello, inngest }`). **New procedures must be exported from their file and registered here**; nothing is auto-discovered.
- [server/routes/rpc/[...].ts](server/routes/rpc/[...].ts) — serves the router over HTTP at `/rpc` via `RPCHandler`. `server/routes/rpc/index.ts` re-exports it so a bare `/rpc` request also matches.
- [app/plugins/orpc.client.ts](app/plugins/orpc.client.ts) — browser: `RPCLink` → `/rpc`, provides `$client` (raw) and `$orpc` (Pinia Colada utils).
- [app/plugins/orpc.server.ts](app/plugins/orpc.server.ts) — SSR: `createRouterClient(router)` in-process, so server rendering never makes an HTTP round trip.

Pages call `useQuery(() => $orpc.x.y.queryOptions({ input }))` and `useMutation($orpc.x.y.mutationOptions({ onSuccess }))`; use a getter (not a plain value) when input is reactive. Invalidate with `$orpc.x.key()` after writes. Example pages: `/hello`, `/inngest`, `/agent`.

When adding a procedure, do both sides: the procedure file, the router registration, then the page. Types flow automatically through `RouterClient<typeof router>`.

### Database

- [server/db/schema.ts](server/db/schema.ts) — Drizzle (`drizzle-orm` 1.0 RC) Postgres schema: `messages` (content, `message_type` enum `result|error`) and `fragments` (message-owned sandbox output: `sandboxUrl`, `title`, `files` jsonb, cascade delete).
- [server/db/relations.ts](server/db/relations.ts) — `defineRelations` for the v1 query builder (`db.query.*`). Only the `one` side (`fragments.message`) carries explicit `from`/`to`; the reverse `many` side infers it.
- [server/db/index.ts](server/db/index.ts) — `drizzle()` over `drizzle-orm/neon-http` (stateless HTTP driver).
- `drizzle.config.ts` points at `server/db/schema.ts`, outputs to `server/db/drizzle/` (no migration files committed yet — the workflow here is `db:push`, not generate/migrate).

`README.md` is currently just a title (`# Vibe`) — this file and the source are the sources of truth.

### Inngest

- [inngest/client.ts](inngest/client.ts) — app id `vibe-development`.
- [inngest/events.ts](inngest/events.ts) — events defined once with `eventType()` + Zod (`test/hello.world`, `agent/coding.requested`), shared by sender and trigger.
- [inngest/functions.ts](inngest/functions.ts) — durable functions `hello-world` and `coding-agent`.
- [server/api/inngest.ts](server/api/inngest.ts) — `serve()` from `inngest/nuxt`; **new functions must be added to its `functions` array**.
- Events are always sent from server procedures (`inngest.trigger`, `agent.run`), never from the browser, so the event key stays server-side.
- Connection failures are mapped to a typed `INNGEST_UNREACHABLE` oRPC error via `isConnectionRefused()` in [inngest/errors.ts](inngest/errors.ts) (walks the `cause` chain for `ECONNREFUSED`).
- Inngest functions must be deterministic and side-effect-free outside `step.run`; use the `step` tools for retries to replay recorded output.

### Coding agent (`/agent`)

Flow: page mutation → `agent.run` sends `agent/coding.requested` with a fresh `runId` as both event ID (dedupe) and realtime channel ID → durable `coding-agent` function creates an E2B sandbox in a memoized `step.run`, runs an AgentKit network, publishes progress/results on `coding-agent:<runId>`, kills the sandbox → page fetches a subscription token and streams via `subscribe()` from `inngest/realtime`.

- [inngest/agents/coding-agent.ts](inngest/agents/coding-agent.ts) — agent, network, tools (`terminal`, `createOrUpdateFiles`, `readFiles`), sandbox helpers. Two non-obvious constraints:
  - **Run the agent through `network.run()`, not `agent.run()`** — only the network appends tool results to the model history; `agent.run` gets stuck after one write-then-explain pass.
  - **E2B is loaded via `createRequire`, not a static import** — bundling its CJS build rewrites `chalk` to `chalk.default` and crashes the server (`chalk.default.red is not a function`). Keep it out of the bundle; a deployment needs `@e2b/code-interpreter` resolvable from the output directory. Tool handlers reconnect to the sandbox by ID each call and wrap work in `step.run` so retries replay instead of repeating sandbox work.
- [inngest/channels.ts](inngest/channels.ts) — per-run channel with `progress` and `result` topics (Zod schemas; infer types with `typeof codingAgentChannel.$infer.progress`).
- The `coding-agent` function is throttled to 30 runs/minute on a single `"deepseek"` key and has an `onFailure` handler that publishes a failed result.
- No auth exists: `agent.subscriptionToken` mints a token for any run ID, and channels are addressable by ID. Any real deployment must check run ownership; the code comments this as a known gap.

### UI

- shadcn-vue (new-york, neutral, remixicon) generated into [app/components/ui/](app/components/ui/), configured in `components.json`; `cn()` helper at [app/lib/utils.ts](app/lib/utils.ts).
- Tailwind CSS v4 via `@tailwindcss/vite` (no `tailwind.config`), tokens in [app/assets/css/tailwind.css](app/assets/css/tailwind.css). Dark mode via `@nuxtjs/color-mode` with `classSuffix: ""`.
- [app/plugins/ssr-width.ts](app/plugins/ssr-width.ts) provides a fixed 1024px SSR width to `@vueuse/core` so media-query-dependent UI renders consistently server-side.
- Path aliases: `~~/` → repo root, `#server/` → `server/`, `~/` and `@/` → `app/`.

## Agent skills in this repo

`.agents/skills/` contains fetched vendor skills (inngest, orpc, nuxt, nitro, pinia, vue, vueuse) tracked by `skills-lock.json`; `.claude/skills/` contains drizzle-kit skills. They are reference material, not project rules; `.agents` is excluded from oxfmt.
