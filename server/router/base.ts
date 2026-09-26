import { os } from "@orpc/server";

/**
 * Shared builder for every procedure in this app.
 *
 * `headers` is the initial context: it is supplied by the entry point that
 * serves the call (the Nitro RPC route for HTTP, `createRouterClient` for SSR)
 * and is therefore optional, since some entry points have no request.
 */
export const base = os.$context<{ headers?: Headers }>();
