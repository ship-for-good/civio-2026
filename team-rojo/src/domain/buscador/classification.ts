import type { Classification, KnowledgeNode, TopicId } from "./types";
import { KNOWLEDGE_GRAPH } from "./knowledge-graph";
import { TOPICS } from "./topics";
import { detectEntity, findEntityById, type EntityMatch } from "./entities";

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
  unknown: "UNKNOWN",
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

export function buildClassificationFromTopicId(
  query: string,
  topicId: TopicId,
  options?: ClassifyOptions
): Classification {
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
 * Resuelve la entidad para una solicitud de derecho de acceso: si el agente ya
 * fijó el `idAmb`, se recupera por id; si no, se detecta a partir de la consulta.
 */
function resolveEntity(
  topicId: TopicId,
  query: string,
  options?: ClassifyOptions
): EntityMatch | null {
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
