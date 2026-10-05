import { run, subscriptionToken } from "./agent";
import { greet } from "./hello";
import { trigger } from "./inngest";

export const router = {
  agent: { run, subscriptionToken },
  hello: { greet },
  inngest: { trigger },
};
