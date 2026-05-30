import fs from "node:fs";
import path from "node:path";
import initSqlJs, { type Database } from "sql.js";

import type {
  ExampleQuestion,
  FeaturedItem,
  NearbyItem,
  PopularTopic,
  PopularTopicArticle,
  Topic,
} from "@/types/aina";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "aina.db");

let dbPromise: Promise<Database> | undefined;

function wasmPath(file: string) {
  return path.join(process.cwd(), "node_modules", "sql.js", "dist", file);
}

async function openDatabase(): Promise<Database> {
  const SQL = await initSqlJs({ locateFile: wasmPath });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    return new SQL.Database(buffer);
  }

  throw new Error("Base de dades no trobada. Executa `npm run db:seed` abans d'arrencar l'app.");
}

export async function getDatabase(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = openDatabase();
  }
  return dbPromise;
}

function rows<T>(db: Database, sql: string): T[] {
  const result = db.exec(sql);
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]]))) as T[];
}

export async function queryExampleQuestions(): Promise<ExampleQuestion[]> {
  const db = await getDatabase();
  return rows<ExampleQuestion>(
    db,
    "SELECT id, text_ca, sort_order FROM example_questions ORDER BY sort_order",
  );
}

export async function queryTopics(): Promise<Topic[]> {
  const db = await getDatabase();
  return rows<Topic>(
    db,
    "SELECT id, title, summary, category, image_key, published_at FROM topics ORDER BY published_at DESC",
  );
}

export async function queryFeatured(): Promise<FeaturedItem[]> {
  const db = await getDatabase();
  return rows<FeaturedItem>(
    db,
    "SELECT id, title, summary, image_key, published_at, source, url FROM featured_items ORDER BY published_at DESC",
  );
}

type PopularTopicRow = {
  slug: string;
  title: string;
  desc: string;
  tags_json: string;
  image_key: string;
  views: number;
  trend: number;
  reason: string;
};

type SummaryRow = { topic_slug: string; sort_order: number; text_ca: string };
type ArticleRow = {
  topic_slug: string;
  sort_order: number;
  title: string;
  source: string;
  url: string;
};

export async function queryPopularTopics(): Promise<PopularTopic[]> {
  const db = await getDatabase();
  const topics = rows<PopularTopicRow>(
    db,
    "SELECT slug, title, desc, tags_json, image_key, views, trend, reason FROM popular_topics",
  );
  if (!topics.length) return [];

  const summaries = rows<SummaryRow>(
    db,
    "SELECT topic_slug, sort_order, text_ca FROM popular_topic_summaries ORDER BY topic_slug, sort_order",
  );
  const articles = rows<ArticleRow>(
    db,
    "SELECT topic_slug, sort_order, title, source, url FROM popular_topic_articles ORDER BY topic_slug, sort_order",
  );

  const summaryBySlug = new Map<string, string[]>();
  for (const s of summaries) {
    const list = summaryBySlug.get(s.topic_slug) ?? [];
    list.push(s.text_ca);
    summaryBySlug.set(s.topic_slug, list);
  }

  const articlesBySlug = new Map<string, PopularTopicArticle[]>();
  for (const a of articles) {
    const list = articlesBySlug.get(a.topic_slug) ?? [];
    list.push({ title: a.title, source: a.source, url: a.url });
    articlesBySlug.set(a.topic_slug, list);
  }

  return topics
    .map((t) => ({
      id: t.slug,
      title: t.title,
      desc: t.desc,
      tags: JSON.parse(t.tags_json) as string[],
      image_key: t.image_key,
      views: t.views,
      trend: t.trend,
      reason: t.reason,
      summary: summaryBySlug.get(t.slug) ?? [],
      articles: articlesBySlug.get(t.slug) ?? [],
    }))
    .sort((a, b) => b.views - a.views);
}

export async function queryNearby(): Promise<NearbyItem[]> {
  const db = await getDatabase();
  return rows<NearbyItem>(
    db,
    "SELECT id, title, category, organization, date, status FROM nearby_items ORDER BY id",
  );
}

export async function healthCheck(): Promise<{ ok: boolean; tables: number }> {
  const db = await getDatabase();
  const result = db.exec(
    "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  );
  const tables = (result[0]?.values[0]?.[0] as number) ?? 0;
  return { ok: true, tables };
}

export { DB_PATH, DB_DIR };
