# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## oRPC + Pinia Colada

Procedures are plain TypeScript functions with runtime-validated input, called from the app like
local functions (oRPC v2).

- `server/router/` — the API. `base.ts` is the shared `os` builder (initial context: `headers`);
  `hello.ts` and `users.ts` are procedures; `index.ts` assembles the router.
- `server/routes/rpc/[...].ts` — serves the router over HTTP at `POST /rpc/<path>`.
- `app/plugins/orpc.client.ts` / `orpc.server.ts` — provide `$client` (raw client) and `$orpc`
  (Pinia Colada utils). In the browser `$client` uses `RPCLink` against `/rpc`; during SSR it is a
  same-process `createRouterClient`, so server rendering never does an HTTP round trip.
- Pages use `useQuery($orpc.user.list.queryOptions())` and
  `useMutation($orpc.user.create.mutationOptions({ onSuccess: … }))`, invalidating
  `$orpc.user.key()` after writes.

Example pages: `/hello` (one query with a reactive input, no database), `/users` (list, create
and delete against the `users` table, including typed `CONFLICT` / `NOT_FOUND` errors),
`/inngest` (send a durable-function event through a mutation) and `/agent` (run a coding agent
and stream its progress).

The `users` table is defined in `server/db/schema.ts`; apply schema changes with `pnpm db:push`.

## Inngest

`/inngest` mutates `inngest.trigger`, which sends the `test/hello.world` event from the server —
so the event key never reaches the browser — and returns the event IDs. The event is defined once
in `inngest/events.ts` with `eventType()`, consumed by the `hello-world` function in
`inngest/functions.ts` (one `step.sleep`), and served at `/api/inngest`
(`server/api/inngest.ts`). A stopped dev server surfaces as the typed `INNGEST_UNREACHABLE`
error.

Run the Inngest dev server next to the app:

```bash
pnpm dev          # app on http://localhost:3012
pnpm dev:inngest  # Inngest dev server on http://localhost:8288
```

`dev:inngest` calls the pinned `inngest-cli` dev dependency at
`node_modules/inngest-cli/bin/inngest` directly: pnpm's bin shim wraps the native binary with
`node`, so `pnpm exec inngest-cli` fails with a `SyntaxError`. The package's postinstall
downloads the platform binary, which is why `inngest-cli` is listed under `allowBuilds` in
`pnpm-workspace.yaml`.

The dev server discovers the app at `http://localhost:3012/api/inngest`; open
`http://localhost:8288` to follow the runs. Inngest v4 defaults to Cloud mode, so local
development needs `INNGEST_DEV=1` (see `.env.example`); production needs `INNGEST_EVENT_KEY`
and `INNGEST_SIGNING_KEY`.

## Coding agent

`/agent` runs a coding agent built with `@inngest/agent-kit` on DeepSeek's `deepseek-flash`
model:

- `inngest/agents/coding-agent.ts` — the agent plus its tools (`write_file`, `read_file`,
  `list_files`). Each run gets its own in-memory scratch workspace, created inside the factory so
  concurrent runs cannot see each other's files.
- `inngest/functions.ts` — the durable `coding-agent` function. It runs the agent with
  `agent.run(prompt, { step })`, so model calls become `step.ai.infer` steps that Inngest retries
  and caches; tool calls report progress through `step.realtime.publish`, and an `onFailure`
  handler publishes a failed result when the run exhausts its retries.
- `inngest/channels.ts` — the per-run realtime channel `coding-agent:<runId>` with `progress` and
  `result` topics.
- `server/router/agent.ts` — `agent.run` (sends the event, returns the run ID) and
  `agent.subscriptionToken` (mints a subscription token for that run's channel).
- `app/pages/agent.vue` — a Pinia Colada mutation starts the run, then the page subscribes with
  `subscribe()` from `inngest/realtime` and renders progress and the final answer.

Set `DEEPSEEK_API_KEY` in `.env` (get one at <https://platform.deepseek.com/api_keys>) and
restart the dev server; without it, `agent.run` fails with the typed `MISSING_API_KEY` error.
`DEEPSEEK_BASE_URL` points the agent at an OpenAI-compatible gateway or a local test server
instead of `https://api.deepseek.com`.

Realtime channels are addressable by ID and this app has no authentication, so
`agent.subscriptionToken` hands out a token for any run ID; a real app must check that the caller
owns the run first.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3012`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
