import { run, subscriptionToken } from "./agent";
import { greet } from "./hello";
import { trigger } from "./inngest";
import { create as createMessage, getMany as getManyMessages } from "./messages";
import { create as createProject, getMany as getManyProjects, getOne } from "./projects";

export const router = {
  agent: { run, subscriptionToken },
  hello: { greet },
  inngest: { trigger },
  messages: { create: createMessage, getMany: getManyMessages },
  projects: { create: createProject, getMany: getManyProjects, getOne },
};
