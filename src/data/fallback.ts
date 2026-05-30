import { EXAMPLE_QUESTIONS, FEATURED_ITEMS, NEARBY_ITEMS, TOPICS } from "@/lib/db/seed-data";

import type { ExampleQuestion, FeaturedItem, NearbyItem, Topic } from "@/types/aina";

export const fallbackExampleQuestions: ExampleQuestion[] = EXAMPLE_QUESTIONS.map((text_ca, i) => ({
  id: i + 1,
  text_ca,
  sort_order: i + 1,
}));

export const fallbackTopics: Topic[] = TOPICS.map((t, i) => ({
  id: i + 1,
  title: t.title,
  summary: t.summary,
  category: t.category,
  image_key: t.image_key,
  published_at: t.published_at,
}));

export const fallbackFeatured: FeaturedItem[] = FEATURED_ITEMS.map((f, i) => ({
  id: i + 1,
  title: f.title,
  summary: f.summary,
  image_key: f.image_key,
  published_at: f.published_at,
}));

export const fallbackNearby: NearbyItem[] = NEARBY_ITEMS.map((n, i) => ({
  id: i + 1,
  title: n.title,
  category: n.category,
  organization: n.organization,
  date: n.date,
  status: n.status,
}));
