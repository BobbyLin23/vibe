import { run, subscriptionToken } from "./agent";
import { greet } from "./hello";
import { trigger } from "./inngest";
import { create as createProject, getMany as getManyProjects } from "./projects";

export const router = {
  agent: { run, subscriptionToken },
  hello: { greet },
  inngest: { trigger },
  projects: { create: createProject, getMany: getManyProjects },
};
