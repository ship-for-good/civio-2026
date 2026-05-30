import type { Classification, KnowledgeNode, TopicId } from "./types";
import { KNOWLEDGE_GRAPH } from "./knowledge-graph";
import { TOPICS } from "./topics";
import {
  detectEntity,
  findEntityById,
  HACIENDA_ID_AMB,
  type EntityMatch,
} from "./entities";

/** Opciones de resolución. `idAmb` permite que el agente fije la entidad. */
export type ClassifyOptions = {
  idAmb?: number;
  fuzzyThreshold?: number;
};

const GRAPH_TOPIC_IDS = new Set(KNOWLEDGE_GRAPH.map((n) => n.id));

const TOPIC_TO_PORTAL: Record<TopicId, string> = {
  retribuciones: "TRANSPARENCIA",
  contratacion: "PLACE",
  subvenciones: "BDNS",
  bienes_patrimonio: "BOE",
  casa_real: "CASA_REAL",
  derecho_acceso: "DERECHO_ACCESO",
  normativa_boe: "BOE",
  estatales_generales: "TRANSPARENCIA",
  hacienda: "DERECHO_ACCESO",
  unknown: "UNKNOWN",
};

/** Entity-backed topics: graph node carries the portada URL; entity data comes from idAmb. */
const ENTITY_TOPIC_ID_AMB: Partial<Record<TopicId, number>> = {
  hacienda: HACIENDA_ID_AMB,
};

export function isKnownTopicId(id: string): id is TopicId {
  return id in TOPICS;
}

export function findNodeByTopicId(
  topicId: Exclude<TopicId, "unknown">
): KnowledgeNode | undefined {
  return KNOWLEDGE_GRAPH.find((n) => n.id === topicId);
}

/** Normaliza un topicId devuelto por el agente (solo ids del grafo o unknown). */
export function normalizeAgentTopicId(raw: string): TopicId {
  const id = raw.trim().toLowerCase();
  if (id === "unknown") return "unknown";
  if (GRAPH_TOPIC_IDS.has(id as Exclude<TopicId, "unknown">)) {
    return id as TopicId;
  }
  return "unknown";
}

/**
 * v1: si la consulta nombra Hacienda, enrutar al topic `hacienda` con portada
 * concreta aunque el agente devuelva otro id (p. ej. derecho_acceso genérico).
 */
function maybeRouteToHaciendaTopic(
  query: string,
  topicId: TopicId,
  options?: ClassifyOptions
): Classification | null {
  if (topicId === "hacienda") return null;

  const entity = detectEntity(query, { fuzzyThreshold: options?.fuzzyThreshold ?? 0 });
  if (entity?.idAmb !== HACIENDA_ID_AMB) return null;

  const haciendaNode = findNodeByTopicId("hacienda");
  if (!haciendaNode) return null;

  return buildClassification("hacienda", query, options, haciendaNode);
}

export function buildClassificationFromTopicId(
  query: string,
  topicId: TopicId,
  options?: ClassifyOptions
): Classification {
  const haciendaRoute = maybeRouteToHaciendaTopic(query, topicId, options);
  if (haciendaRoute) return haciendaRoute;

  if (topicId === "unknown") {
    return buildClassification("unknown", query, options);
  }

  const node = findNodeByTopicId(topicId);
  if (!node || !isKnownTopicId(topicId)) {
    return buildClassification("unknown", query, options);
  }

  return buildClassification(topicId, query, options, node);
}

/**
 * Resuelve la entidad objetivo:
 * - Temas con entidad fija (`hacienda`, …) → lookup por idAmb del grafo.
 * - `derecho_acceso` → idAmb del agente o detección heurística en la consulta.
 */
function resolveEntity(
  topicId: TopicId,
  query: string,
  options?: ClassifyOptions
): EntityMatch | null {
  const topicEntityId = ENTITY_TOPIC_ID_AMB[topicId];
  if (topicEntityId != null) return findEntityById(topicEntityId);

  if (topicId !== "derecho_acceso") return null;
  if (options?.idAmb != null) return findEntityById(options.idAmb);
  return detectEntity(query, { fuzzyThreshold: options?.fuzzyThreshold ?? 0 });
}

function buildClassification(
  topicId: TopicId,
  query: string,
  options?: ClassifyOptions,
  node?: KnowledgeNode
): Classification {
  const copy = TOPICS[topicId];
  const resolvedUrl =
    topicId === "unknown" ? "https://transparencia.gob.es" : node!.source_url;

  // La entidad es la única fuente del deepLink (portada) y de los datos
  // estructurados para derecho_acceso. El resto de temas usan buildDeepLink.
  const entity = resolveEntity(topicId, query, options);
  const dl = entity ? entity.portadaUrl : copy.buildDeepLink?.(query);

  return {
    topicId,
    portal: TOPIC_TO_PORTAL[topicId],
    label: copy.label,
    portalUrl: resolvedUrl,
    routingType: node?.type ?? "interno",
    isSpecialSection: node?.is_special_section ?? false,
    explanation: copy.explanation,
    steps: copy.steps,
    ...(copy.searchTip !== undefined && { searchTip: copy.searchTip }),
    ...(dl !== undefined && { deepLink: dl }),
    ...(entity !== null && { entityMatch: entity }),
  };
}
