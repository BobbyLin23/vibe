import { run, subscriptionToken } from "./agent";
import { greet } from "./hello";
import { trigger } from "./inngest";
import { create, getMany } from "./messages";

export const router = {
  agent: { run, subscriptionToken },
  hello: { greet },
  inngest: { trigger },
  messages: { create, getMany },
};
