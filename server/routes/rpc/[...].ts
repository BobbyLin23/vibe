import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "#server/router";

const handler = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});

export default defineEventHandler(async (event) => {
  const request = toWebRequest(event);

  const { response } = await handler.handle(request, {
    prefix: "/rpc",
    context: { headers: request.headers },
  });

  if (response) {
    return response;
  }

  setResponseStatus(event, 404, "Not Found");
  return "Not found";
});
