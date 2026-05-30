import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs from "sql.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dbDir = path.join(root, "data");
const dbPath = path.join(dbDir, "aina.db");
const seedContentPath = path.join(dbDir, "seed-content.json");

/** @type {{ featured: Array<Record<string, string>>, popular_topics: Array<Record<string, unknown>> }} */
const seedContent = JSON.parse(fs.readFileSync(seedContentPath, "utf8"));

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS example_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text_ca TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  image_key TEXT NOT NULL,
  published_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS featured_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  image_key TEXT NOT NULL,
  published_at TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS nearby_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  organization TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS popular_topics (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  desc TEXT NOT NULL,
  tags_json TEXT NOT NULL,
  image_key TEXT NOT NULL,
  views INTEGER NOT NULL,
  trend INTEGER NOT NULL,
  reason TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS popular_topic_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  text_ca TEXT NOT NULL,
  FOREIGN KEY (topic_slug) REFERENCES popular_topics(slug)
);
CREATE TABLE IF NOT EXISTS popular_topic_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_slug TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  FOREIGN KEY (topic_slug) REFERENCES popular_topics(slug)
);
`;

const EXAMPLE_QUESTIONS = [
  "Què cobra el president de la Generalitat?",
  "Quines subvencions té 42 Barcelona?",
  "Quant costa el manteniment del Tramvia Blau?",
  "Quines empreses han rebut ajudes públiques aquest any?",
  "Quin pressupost té el meu ajuntament?",
  "Quines obres públiques hi ha previstes al meu barri?",
  "Quins contractes ha adjudicat la Generalitat aquest mes?",
  "Quant s'ha gastat en comunicació institucional?",
  "Quins càrrecs públics tenen cotxe oficial?",
  "Quines subvencions culturals s'han concedit recentment?",
];

const TOPICS = [
  [
    "Contractació pública",
    "Licitacions, adjudicacions i formalitzacions de l'Ajuntament i entitats municipals.",
    "Contractes",
    "topic-contracts",
    "2026-05-28",
  ],
  [
    "Pressupostos",
    "Pressupostos anuals, execució i situació econòmico-presupostària de l'Ajuntament.",
    "Pressupost",
    "topic-budgets",
    "2026-05-27",
  ],
  [
    "Subvencions",
    "Convocatòries, ajudes concedides i dades obertes de subvencions municipals.",
    "Subvencions",
    "topic-grants",
    "2026-05-26",
  ],
  [
    "Mobilitat",
    "Plans de mobilitat, infraestructures i informació relacionada amb el transport a la ciutat.",
    "Mobilitat",
    "topic-mobility",
    "2026-05-25",
  ],
  [
    "Medi ambient",
    "Qualitat de l'aire, soroll, impacte ambiental i informació ambiental municipal.",
    "Clima",
    "topic-budgets",
    "2026-05-24",
  ],
  [
    "Habitatge",
    "Polítiques de vivenda, rehabilitació i subvencions de l'Institut Municipal de l'Habitatge.",
    "Habitatge",
    "topic-contracts",
    "2026-05-23",
  ],
];

const NEARBY = [
  ["Reforma de la Plaça Major", "Obra pública", "Ajuntament", "12/05/2026", "En curs"],
  ["Subvenció a entitats culturals", "Subvenció", "Diputació", "08/05/2026", "Adjudicada"],
  ["Pla de mobilitat sostenible", "Anunci", "Generalitat", "02/05/2026", "Publicat"],
  ["Contracte de neteja viària", "Contractació", "Ajuntament", "28/04/2026", "Licitació"],
  ["Ampliació carril bici", "Obra pública", "Ajuntament", "20/04/2026", "Planificada"],
  ["Pressupost participatiu 2026", "Pressupost", "Ajuntament", "15/04/2026", "En votació"],
  ["Licitació serveis socials", "Contractació", "Consell Comarcal", "10/04/2026", "Licitació"],
  ["Informe qualitat de l'aire", "Medi ambient", "Generalitat", "05/04/2026", "Publicat"],
];

async function main() {
  const SQL = await initSqlJs({
    locateFile: (f) => path.join(root, "node_modules", "sql.js", "dist", f),
  });

  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  fs.mkdirSync(dbDir, { recursive: true });

  const db = new SQL.Database();
  db.run(SCHEMA_SQL);

  EXAMPLE_QUESTIONS.forEach((text, i) => {
    db.run("INSERT INTO example_questions (text_ca, sort_order) VALUES (?, ?)", [text, i + 1]);
  });
  TOPICS.forEach((row) => {
    db.run(
      "INSERT INTO topics (title, summary, category, image_key, published_at) VALUES (?, ?, ?, ?, ?)",
      row,
    );
  });

  for (const f of seedContent.featured) {
    db.run(
      "INSERT INTO featured_items (title, summary, image_key, published_at, source, url) VALUES (?, ?, ?, ?, ?, ?)",
      [f.title, f.summary, f.image_key, f.published_at, f.source, f.url],
    );
  }

  for (const topic of seedContent.popular_topics) {
    db.run(
      `INSERT INTO popular_topics (slug, title, desc, tags_json, image_key, views, trend, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        topic.slug,
        topic.title,
        topic.desc,
        JSON.stringify(topic.tags),
        topic.image_key,
        topic.views,
        topic.trend,
        topic.reason,
      ],
    );
    topic.summary.forEach((text, i) => {
      db.run(
        "INSERT INTO popular_topic_summaries (topic_slug, sort_order, text_ca) VALUES (?, ?, ?)",
        [topic.slug, i + 1, text],
      );
    });
    topic.articles.forEach((article, i) => {
      db.run(
        "INSERT INTO popular_topic_articles (topic_slug, sort_order, title, source, url) VALUES (?, ?, ?, ?, ?)",
        [topic.slug, i + 1, article.title, article.source, article.url],
      );
    });
  }

  NEARBY.forEach((row) => {
    db.run(
      "INSERT INTO nearby_items (title, category, organization, date, status) VALUES (?, ?, ?, ?, ?)",
      row,
    );
  });

  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
  const featuredCount = seedContent.featured.length;
  const popularCount = seedContent.popular_topics.length;
  console.log(
    `✓ Base de dades creada: ${dbPath} (${featuredCount} destacats, ${popularCount} temes populars)`,
  );
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
