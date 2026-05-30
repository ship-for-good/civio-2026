import type { Classification, KnowledgeNode } from "./types";
import {
  buildClassificationFromTopicId,
  isKnownTopicId,
  type ClassifyOptions,
} from "./classification";
import { KNOWLEDGE_GRAPH } from "./knowledge-graph";

export { normalize, matchesKeyword } from "./match-keywords";
import { normalize, matchesKeyword, fuzzyMatchesKeyword } from "./match-keywords";

function nodeMatches(normalizedText: string, node: KnowledgeNode): boolean {
  const sortedKeywords = [...node.keywords].sort(
    (a, b) => normalize(b).length - normalize(a).length,
  );
  return sortedKeywords.some((kw) =>
    matchesKeyword(normalizedText, normalize(kw)),
  );
}

function fuzzyNodeMatches(
  normalizedText: string,
  node: KnowledgeNode,
  threshold: number
): boolean {
  const sortedKeywords = [...node.keywords].sort(
    (a, b) => normalize(b).length - normalize(a).length,
  );
  return sortedKeywords.some((kw) =>
    fuzzyMatchesKeyword(normalizedText, normalize(kw), threshold),
  );
}

/**
 * Clasificador determinista (keywords). Tests y respaldo sin API.
 * @param options.fuzzyThreshold — activa fuzzy matching si no hay match exacto
 */
export function classify(
  query: string,
  options?: ClassifyOptions
): Classification {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery.trim()) {
    return buildClassificationFromTopicId(query, "unknown", options);
  }

  const node = KNOWLEDGE_GRAPH.find((n) => nodeMatches(normalizedQuery, n));

  if (node) {
    if (!isKnownTopicId(node.id)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[buscador] El nodo "${node.id}" está en keywords.json pero no en topics.ts; se usa unknown.`,
        );
      }
      return buildClassificationFromTopicId(query, "unknown", options);
    }
    return buildClassificationFromTopicId(query, node.id, options);
  }

  if (options?.fuzzyThreshold && options.fuzzyThreshold > 0) {
    const fuzzyNode = KNOWLEDGE_GRAPH.find((n) =>
      fuzzyNodeMatches(normalizedQuery, n, options.fuzzyThreshold!)
    );
    if (fuzzyNode) {
      if (!isKnownTopicId(fuzzyNode.id)) {
        return buildClassificationFromTopicId(query, "unknown", options);
      }
      return buildClassificationFromTopicId(query, fuzzyNode.id, options);
    }
  }

  return buildClassificationFromTopicId(query, "unknown", options);
}
