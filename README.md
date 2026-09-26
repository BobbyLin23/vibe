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

Example pages: `/hello` (one query with a reactive input, no database) and `/users` (list, create
and delete against the `users` table, including typed `CONFLICT` / `NOT_FOUND` errors).

The `users` table is defined in `server/db/schema.ts`; apply schema changes with `pnpm db:push`.

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

Start the development server on `http://localhost:3000`:

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
