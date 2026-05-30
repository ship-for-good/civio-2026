import { Agent, CursorAgentError } from "@cursor/sdk";
import { KNOWLEDGE_GRAPH } from "@/domain/buscador/knowledge-graph";
import { normalizeAgentTopicId } from "@/domain/buscador/classification";
import type { TopicId } from "@/domain/buscador/types";
import { getCursorApiKey } from "./get-api-key";

export type ResolveTopicPayload = {
  topicId: string;
};

export type ResolveTopicResult = {
  topicId: TopicId;
  rawText: string;
  runStatus: string;
  error?: string;
};

function buildClassifyPrompt(query: string): string {
  const graphForPrompt = KNOWLEDGE_GRAPH.map((n) => ({
    id: n.id,
    keywords: n.keywords,
  }));

  return `Eres un clasificador para el buscador de información pública de Civio (España).

Tarea: según la consulta del ciudadano, elige UN id del knowledge_graph cuyas keywords encajen mejor con el significado de la pregunta.

knowledge_graph (ids y keywords):
${JSON.stringify(graphForPrompt, null, 2)}

Reglas:
- Responde ÚNICAMENTE JSON válido, sin markdown: {"topicId":"<id>"}
- <id> debe ser exactamente uno de los id del grafo, o "unknown" si ninguno encaja
- Si varios nodos podrían encajar, elige el más específico
- Si la consulta menciona el Ministerio de Hacienda (p. ej. "hacienda", "reclamo a hacienda"), devuelve "hacienda" y no "derecho_acceso"
- No inventes ids que no estén en el grafo

Consulta del ciudadano:
${query.trim()}`;
}

export function parseTopicIdFromAgentText(text: string): TopicId | null {
  const match = text.match(/\{[\s\S]*"topicId"[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]) as ResolveTopicPayload;
    if (typeof parsed.topicId !== "string") return null;
    return normalizeAgentTopicId(parsed.topicId);
  } catch {
    return null;
  }
}

/**
 * Demo local: el agente Cursor lee el grafo de keywords y devuelve topicId.
 */
export async function resolveTopicId(query: string): Promise<ResolveTopicResult> {
  const apiKey = getCursorApiKey();
  const cwd = process.cwd();
  const prompt = buildClassifyPrompt(query);

  try {
    const result = await Agent.prompt(prompt, {
      apiKey,
      model: { id: "composer-2.5" },
      local: { cwd, settingSources: [] },
    });

    const rawText = (result.result ?? "").trim();

    if (result.status === "error") {
      return {
        topicId: "unknown",
        rawText,
        runStatus: result.status,
        error: "El agente terminó con status error",
      };
    }

    const topicId = parseTopicIdFromAgentText(rawText);
    if (!topicId) {
      return {
        topicId: "unknown",
        rawText,
        runStatus: result.status,
        error: "No se pudo parsear topicId del JSON del agente",
      };
    }

    return {
      topicId,
      rawText,
      runStatus: result.status,
    };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      return {
        topicId: "unknown",
        rawText: "",
        runStatus: "startup_failed",
        error: err.message,
      };
    }
    throw err;
  }
}
