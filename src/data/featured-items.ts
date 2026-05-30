import seedContent from "../../data/seed-content.json";

/** Destacats — fonts: https://ajuntament.barcelona.cat/transparencia/ca */

export type FeaturedSeedItem = {
  title: string;
  summary: string;
  image_key: "topic-contracts" | "topic-budgets" | "topic-grants" | "topic-mobility";
  published_at: string;
  source: string;
  url: string;
};

export const FEATURED_ITEMS = seedContent.featured as FeaturedSeedItem[];
