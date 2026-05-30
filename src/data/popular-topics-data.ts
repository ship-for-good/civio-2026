import seedContent from "../../data/seed-content.json";

/** Dades serialitzables per SQLite (sense imports d'imatges). */

export type PopularArticleData = { title: string; source: string; url: string };

export type PopularTopicData = {
  slug: string;
  title: string;
  desc: string;
  tags: string[];
  image_key: "topic-contracts" | "topic-budgets" | "topic-grants" | "topic-mobility";
  views: number;
  trend: number;
  reason: string;
  summary: string[];
  articles: PopularArticleData[];
};

export const POPULAR_TOPICS_DATA = seedContent.popular_topics as PopularTopicData[];
