import { imageForKey } from "@/lib/assets";
import type { PopularTopic as PopularTopicBase } from "@/types/aina";
import { POPULAR_TOPICS_DATA } from "@/data/popular-topics-data";

export type { PopularTopicArticle } from "@/types/aina";

/** Tema amb URL d'imatge resolta per al client. */
export type PopularTopic = PopularTopicBase & { img: string };

export function toPopularTopicView(topic: PopularTopicBase): PopularTopic {
  return { ...topic, img: imageForKey(topic.image_key) };
}

/** Fallback quan la base de dades no està disponible. */
export const POPULAR_TOPICS: PopularTopic[] = POPULAR_TOPICS_DATA.map((row) =>
  toPopularTopicView({
    id: row.slug,
    title: row.title,
    desc: row.desc,
    tags: row.tags,
    image_key: row.image_key,
    views: row.views,
    trend: row.trend,
    reason: row.reason,
    summary: row.summary,
    articles: row.articles,
  }),
);

export { POPULAR_TOPICS_DATA };
