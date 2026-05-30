/** Seed data for SQLite — Catalan public-transparency demo content. */

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

export const TOPICS = [
  {
    title: "Contractació pública",
    summary: "Qui guanya les licitacions i amb quins criteris.",
    category: "Contractes",
    image_key: "topic-contracts",
    published_at: "2026-05-28",
  },
  {
    title: "Pressupostos",
    summary: "On va cada euro del pressupost municipal i autonòmic.",
    category: "Pressupost",
    image_key: "topic-budgets",
    published_at: "2026-05-27",
  },
  {
    title: "Subvencions",
    summary: "Ajudes públiques concedides a entitats i empreses.",
    category: "Subvencions",
    image_key: "topic-grants",
    published_at: "2026-05-26",
  },
  {
    title: "Mobilitat",
    summary: "Inversions en transport públic i carrils bici.",
    category: "Mobilitat",
    image_key: "topic-mobility",
    published_at: "2026-05-25",
  },
  {
    title: "Medi ambient",
    summary: "Polítiques de sostenibilitat i qualitat de l'aire.",
    category: "Clima",
    image_key: "topic-budgets",
    published_at: "2026-05-24",
  },
  {
    title: "Alts càrrecs",
    summary: "Retribucions, agendes i declaracions de béns.",
    category: "Transparència",
    image_key: "topic-contracts",
    published_at: "2026-05-23",
  },
];

export const FEATURED_ITEMS = [
  {
    title: "Publicat el portal d'alts càrrecs 2026",
    summary: "Inclou retribucions, agendes i declaracions de béns actualitzades.",
    image_key: "topic-contracts",
    published_at: "2026-05-26",
  },
  {
    title: "Nou conveni col·lectiu municipal",
    summary: "Detalls del conveni signat amb els treballadors públics aquest mes.",
    image_key: "topic-grants",
    published_at: "2026-05-22",
  },
  {
    title: "Auditoria del transport metropolità",
    summary: "Resultats de l'auditoria independent sobre eficiència i costos.",
    image_key: "topic-mobility",
    published_at: "2026-05-18",
  },
  {
    title: "Memòria anual de subvencions",
    summary: "Resum amb totes les ajudes concedides durant l'any anterior.",
    image_key: "topic-budgets",
    published_at: "2026-05-14",
  },
  {
    title: "Índex de transparència municipal",
    summary: "Classificació dels ajuntaments segons publicació de dades obertes.",
    image_key: "topic-contracts",
    published_at: "2026-05-10",
  },
];

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
  published_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS nearby_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  organization TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL
);
`;
