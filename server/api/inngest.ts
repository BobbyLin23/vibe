import { serve } from "inngest/nuxt";
import { inngest } from "~~/inngest/client";
import { helloWorld } from "~~/inngest/functions.ts";

export default defineEventHandler(
  serve({
    client: inngest,
    functions: [helloWorld],
  }),
);
