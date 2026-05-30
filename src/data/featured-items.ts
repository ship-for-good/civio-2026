import seedContent from "../../data/seed-content.json";

/** Destacats — fonts: https://ajuntament.barcelona.cat/transparencia/ca */

export type FeaturedImageKey =
  | "featured-pressupost"
  | "featured-infoparticipa"
  | "featured-subvencions"
  | "featured-alts-carrecs"
  | "featured-mobilitat"
  | "featured-etica";

export type FeaturedSeedItem = {
  title: string;
  summary: string;
  image_key: FeaturedImageKey;
  published_at: string;
  source: string;
  url: string;
};

export const FEATURED_ITEMS = seedContent.featured as FeaturedSeedItem[];
