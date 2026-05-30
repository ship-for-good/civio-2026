/** Seed data for SQLite — Catalan public-transparency demo content. */

import { FEATURED_ITEMS as FEATURED_FROM_DATA } from "@/data/featured-items";

export const EXAMPLE_QUESTIONS = [
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

/** Aliniat amb `src/data/popular-topics.ts` i el portal de transparència de Barcelona. */
export const TOPICS = [
  {
    title: "Contractació pública",
    summary:
      "Licitacions, adjudicacions i formalitzacions de l'Ajuntament i entitats municipals.",
    category: "Contractes",
    image_key: "topic-contracts",
    published_at: "2026-05-28",
  },
  {
    title: "Pressupostos",
    summary: "Pressupostos anuals, execució i situació econòmico-presupostària de l'Ajuntament.",
    category: "Pressupost",
    image_key: "topic-budgets",
    published_at: "2026-05-27",
  },
  {
    title: "Subvencions",
    summary: "Convocatòries, ajudes concedides i dades obertes de subvencions municipals.",
    category: "Subvencions",
    image_key: "topic-grants",
    published_at: "2026-05-26",
  },
  {
    title: "Mobilitat",
    summary: "Plans de mobilitat, infraestructures i informació relacionada amb el transport a la ciutat.",
    category: "Mobilitat",
    image_key: "topic-mobility",
    published_at: "2026-05-25",
  },
  {
    title: "Medi ambient",
    summary: "Qualitat de l'aire, soroll, impacte ambiental i informació ambiental municipal.",
    category: "Clima",
    image_key: "topic-budgets",
    published_at: "2026-05-24",
  },
  {
    title: "Habitatge",
    summary: "Polítiques de vivenda, rehabilitació i subvencions de l'Institut Municipal de l'Habitatge.",
    category: "Habitatge",
    image_key: "topic-contracts",
    published_at: "2026-05-23",
  },
];

export const FEATURED_ITEMS = FEATURED_FROM_DATA;

export const NEARBY_ITEMS = [
  {
    title: "Reforma de la Plaça Major",
    category: "Obra pública",
    organization: "Ajuntament",
    date: "12/05/2026",
    status: "En curs",
  },
  {
    title: "Subvenció a entitats culturals",
    category: "Subvenció",
    organization: "Diputació",
    date: "08/05/2026",
    status: "Adjudicada",
  },
  {
    title: "Pla de mobilitat sostenible",
    category: "Anunci",
    organization: "Generalitat",
    date: "02/05/2026",
    status: "Publicat",
  },
  {
    title: "Contracte de neteja viària",
    category: "Contractació",
    organization: "Ajuntament",
    date: "28/04/2026",
    status: "Licitació",
  },
  {
    title: "Ampliació carril bici",
    category: "Obra pública",
    organization: "Ajuntament",
    date: "20/04/2026",
    status: "Planificada",
  },
  {
    title: "Pressupost participatiu 2026",
    category: "Pressupost",
    organization: "Ajuntament",
    date: "15/04/2026",
    status: "En votació",
  },
  {
    title: "Licitació serveis socials",
    category: "Contractació",
    organization: "Consell Comarcal",
    date: "10/04/2026",
    status: "Licitació",
  },
  {
    title: "Informe qualitat de l'aire",
    category: "Medi ambient",
    organization: "Generalitat",
    date: "05/04/2026",
    status: "Publicat",
  },
];

export const SCHEMA_SQL = `
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
