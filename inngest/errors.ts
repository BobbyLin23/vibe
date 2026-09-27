/**
 * The SDK surfaces transport failures as `TypeError: fetch failed` and keeps the socket
 * error on `cause`, aggregated per resolved address.
 */
export function isConnectionRefused(error: unknown): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 5 && current instanceof Error; depth++) {
    if ((current as { code?: unknown }).code === "ECONNREFUSED") {
      return true;
    }

    current = current.cause;
  }

  return false;
}

/** Shared oRPC error entry for procedures that send events to Inngest. */
export const inngestUnreachable = {
  message: "Could not reach Inngest — run `pnpm dev:inngest` for local development",
};
