import type { RouterClient } from "@orpc/server";
import { createRouterClient } from "@orpc/server";
import { createPiniaColadaUtils } from "@orpc/pinia-colada";
import { router } from "~~/server/router";

export default defineNuxtPlugin(() => {
  const event = useRequestEvent();

  // Same-process client: no HTTP round trip during SSR.
  const client: RouterClient<typeof router> = createRouterClient(router, {
    context: {
      headers: event?.headers,
    },
  });

  const orpc = createPiniaColadaUtils(client);

  return {
    provide: {
      client,
      orpc,
    },
  };
});
