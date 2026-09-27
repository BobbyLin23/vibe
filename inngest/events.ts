import { eventType } from "inngest";
import { z } from "zod";

/**
 * Single definition of the test event, shared by the trigger (`inngest/functions.ts`)
 * and the sender (`server/router/inngest.ts`), so both sides stay in sync.
 */
export const helloWorldEvent = eventType("test/hello.world", {
  schema: z.object({ message: z.string().min(1) }),
});
