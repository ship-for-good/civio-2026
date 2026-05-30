import fs from "node:fs";
import path from "node:path";
import initSqlJs, { type Database } from "sql.js";

import type { ExampleQuestion, FeaturedItem, NearbyItem, Topic } from "@/types/aina";

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
    "SELECT id, title, summary, image_key, published_at FROM featured_items ORDER BY published_at DESC",
  );
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
