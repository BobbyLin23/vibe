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
and delete against the `users` table, including typed `CONFLICT` / `NOT_FOUND` errors) and
`/inngest` (send a durable-function event through a mutation).

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

The dev server discovers the app at `http://localhost:3012/api/inngest`; open
`http://localhost:8288` to follow the runs. Inngest v4 defaults to Cloud mode, so local
development needs `INNGEST_DEV=1` (see `.env.example`); production needs `INNGEST_EVENT_KEY`
and `INNGEST_SIGNING_KEY`.

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
