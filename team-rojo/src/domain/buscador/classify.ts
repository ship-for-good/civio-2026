import type { Classification, KnowledgeNode } from "./types";
import { buildClassificationFromTopicId, isKnownTopicId } from "./classification";
import { KNOWLEDGE_GRAPH } from "./knowledge-graph";

export { normalize, matchesKeyword } from "./match-keywords";
import { normalize, matchesKeyword } from "./match-keywords";

function nodeMatches(normalizedText: string, node: KnowledgeNode): boolean {
  const sortedKeywords = [...node.keywords].sort(
    (a, b) => normalize(b).length - normalize(a).length
  );
  return sortedKeywords.some((kw) =>
    matchesKeyword(normalizedText, normalize(kw))
  );
}

/**
 * Clasificador determinista (keywords). Tests y respaldo sin API.
 */
export function classify(query: string): Classification {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery.trim()) {
    return buildClassificationFromTopicId(query, "unknown");
  }

  const node = KNOWLEDGE_GRAPH.find((n) => nodeMatches(normalizedQuery, n));

  if (!node) {
    return buildClassificationFromTopicId(query, "unknown");
  }

  if (!isKnownTopicId(node.id)) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[buscador] El nodo "${node.id}" está en keywords.json pero no en topics.ts; se usa unknown.`
      );
    }
    return buildClassificationFromTopicId(query, "unknown");
  }

  return buildClassificationFromTopicId(query, node.id);
}
