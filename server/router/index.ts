import { run, subscriptionToken } from "./agent";
import { greet } from "./hello";
import { trigger } from "./inngest";
import { create, list, remove } from "./users";

export const router = {
  agent: { run, subscriptionToken },
  hello: { greet },
  inngest: { trigger },
  user: { list, create, remove },
};
