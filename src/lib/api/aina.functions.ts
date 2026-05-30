import { createServerFn } from "@tanstack/react-start";

import {
  healthCheck,
  queryExampleQuestions,
  queryFeatured,
  queryNearby,
  queryTopics,
} from "../db/client.server";

export const getHealth = createServerFn({ method: "GET" }).handler(async () => healthCheck());

export const getExampleQuestions = createServerFn({ method: "GET" }).handler(async () =>
  queryExampleQuestions(),
);

export const getTopics = createServerFn({ method: "GET" }).handler(async () => queryTopics());

export const getFeatured = createServerFn({ method: "GET" }).handler(async () => queryFeatured());

export const getNearby = createServerFn({ method: "GET" }).handler(async () => queryNearby());
