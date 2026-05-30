import type { KeywordsConfig } from "./types";
// Fuente única: edita team-rojo/docs/keywords.json (reinicia `npm run dev` tras cambios).
import keywordsData from "../../../docs/keywords.json";

export const KEYWORDS_V2 = keywordsData as KeywordsConfig;

export const KNOWLEDGE_GRAPH = KEYWORDS_V2.knowledge_graph;

export const ROUTING_CONFIG = KEYWORDS_V2.config;
