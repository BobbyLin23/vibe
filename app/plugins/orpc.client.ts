import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createPiniaColadaUtils } from "@orpc/pinia-colada";
import type { router } from "~~/server/router";

export default defineNuxtPlugin(() => {
  const link = new RPCLink({
    url: "/rpc",
  });

  const client: RouterClient<typeof router> = createORPCClient(link);

  // Pinia Colada utils: `orpc.user.list.queryOptions()` etc.
  const orpc = createPiniaColadaUtils(client);

  return {
    provide: {
      client,
      orpc,
    },
  };
});
