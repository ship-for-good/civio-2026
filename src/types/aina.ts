export type ExampleQuestion = {
  id: number;
  text_ca: string;
  sort_order: number;
};

export type Topic = {
  id: number;
  title: string;
  summary: string;
  category: string;
  image_key: string;
  published_at: string;
};

export type FeaturedItem = {
  id: number;
  title: string;
  summary: string;
  image_key: string;
  published_at: string;
  source: string;
  url: string;
};

export type PopularTopicArticle = {
  title: string;
  source: string;
  url: string;
};

export type PopularTopic = {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  image_key: string;
  views: number;
  trend: number;
  reason: string;
  summary: string[];
  articles: PopularTopicArticle[];
};

export type NearbyItem = {
  id: number;
  title: string;
  category: string;
  organization: string;
  date: string;
  status: string;
};
