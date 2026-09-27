import { z } from "zod";
import { inngest } from "~~/inngest/client";
import { helloWorldEvent } from "~~/inngest/events";
import { base } from "./base";

/**
 * Sends the `test/hello.world` event, which triggers the `hello-world` function
 * in `inngest/functions.ts`.
 *
 * Events are emitted from the server so the event key (or the dev server
 * address) never reaches the browser. Follow the runs in the Inngest dev
 * server: <http://localhost:8288>.
 */
export const trigger = base
  .errors({
    INNGEST_UNREACHABLE: {
      message: "Could not reach Inngest — run `pnpm dev:inngest` for local development",
    },
  })
  .input(
    z.object({
      message: z.string().trim().min(1).max(200),
      /** Optional event ID: identical IDs are deduplicated for 24 hours. */
      id: z.string().trim().min(1).max(120).optional(),
    }),
  )
  .output(z.object({ ids: z.array(z.string()) }))
  .handler(async ({ input, errors }) => {
    try {
      return await inngest.send(
        helloWorldEvent.create({ message: input.message }, { id: input.id }),
      );
    } catch (error) {
      // A stopped server shows up as an undici transport failure: `TypeError: fetch failed`
      // with the socket error on `cause`, aggregated per resolved address.
      let current: unknown = error;

      for (let depth = 0; depth < 5 && current instanceof Error; depth++) {
        if ((current as { code?: unknown }).code === "ECONNREFUSED") {
          throw errors.INNGEST_UNREACHABLE();
        }

        current = current.cause;
      }

      throw error;
    }
  });
