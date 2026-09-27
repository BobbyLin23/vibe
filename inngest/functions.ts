import { inngest } from "./client";
import { helloWorldEvent } from "./events";

export const helloWorld = inngest.createFunction(
  {
    id: "hello-world",
    triggers: [helloWorldEvent],
  },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return {
      message: `Hello World! ${event.data.message}`,
    };
  },
);
