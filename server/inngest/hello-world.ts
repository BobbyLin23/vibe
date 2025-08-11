import { inngest } from './client'

export default inngest.createFunction(
  { id: 'hello-world' },
  { event: 'demo/event.sent' },
  async ({ event, step }) => {
    await step.sleep('wait-a-moment', '1s')
    return {
      message: `Hello ${event.name}!`,
    }
  },
)
