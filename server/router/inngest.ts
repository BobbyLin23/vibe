import { z } from "zod";
import { inngest } from "~~/inngest/client";
import { inngestUnreachable, isConnectionRefused } from "~~/inngest/errors";
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
  .errors({ INNGEST_UNREACHABLE: inngestUnreachable })
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
      if (isConnectionRefused(error)) {
        throw errors.INNGEST_UNREACHABLE();
      }

      throw error;
    }
  });
