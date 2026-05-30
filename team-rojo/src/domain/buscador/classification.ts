import type { Classification, KnowledgeNode, TopicId } from "./types";
import { KNOWLEDGE_GRAPH } from "./knowledge-graph";
import { TOPICS } from "./topics";

const GRAPH_TOPIC_IDS = new Set(KNOWLEDGE_GRAPH.map((n) => n.id));

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
  topicId: TopicId
): Classification {
  if (topicId === "unknown") {
    return buildClassification("unknown", query);
  }

  const node = findNodeByTopicId(topicId);
  if (!node || !isKnownTopicId(topicId)) {
    return buildClassification("unknown", query);
  }

  return buildClassification(topicId, query, node);
}

function buildClassification(
  topicId: TopicId,
  query: string,
  node?: KnowledgeNode
): Classification {
  const copy = TOPICS[topicId];
  const resolvedUrl =
    topicId === "unknown" ? "https://transparencia.gob.es" : node!.source_url;

  return {
    topicId,
    label: copy.label,
    portalUrl: resolvedUrl,
    routingType: node?.type ?? "interno",
    isSpecialSection: node?.is_special_section ?? false,
    explanation: copy.explanation,
    steps: copy.steps,
    ...(copy.searchTip !== undefined && { searchTip: copy.searchTip }),
    ...(copy.buildDeepLink !== undefined && { deepLink: copy.buildDeepLink(query) }),
  };
}
