import { z } from "zod";
import { base } from "./base";

/**
 * Simplest possible procedure: typed input, typed output, no database.
 *
 * `servedAt` is a `Date`, which the RPC serializer transports natively, so the
 * client receives a real `Date` rather than a string.
 */
export const greet = base
  .input(z.object({ name: z.string().trim().min(1).max(50) }))
  .output(z.object({ message: z.string(), servedAt: z.date() }))
  .handler(({ input }) => {
    return {
      message: `Hello, ${input.name}!`,
      servedAt: new Date(),
    };
  });
