import { createRouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { router } from '~~/server/router'

/**
 * This is part of the Optimize SSR setup.
 *
 * @see {@link https://orpc.unnoq.com/docs/adapters/nuxt#optimize-ssr}
 */
export default defineNuxtPlugin(() => {
  // const event = useRequestEvent()

  const client = createRouterClient(router, {
    context: {
      // headers: event?.headers,
    },
  })

  const orpc = createTanstackQueryUtils(client)

  return {
    provide: {
      orpc,
    },
  }
})
