import type {
  AskResponse,
  AskStatus,
  Availability,
  Catalog,
  Topic,
} from "@/types";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function availabilityToStatus(availability: Availability): AskStatus {
  switch (availability) {
    case "hosted":
      return "found";
    case "linked":
      return "linked";
    case "external_portal":
      return "external";
    case "not_published":
      return "not_found";
  }
}

export function matchTopics(query: string, topics: Topic[]): Topic[] {
  const q = normalize(query);

  return topics
    .map((topic) => {
      let score = 0;

      for (const kw of topic.keywords) {
        if (q.includes(normalize(kw))) score += 2;
      }

      if (q.includes(normalize(topic.name))) score += 3;

      for (const word of topic.name.split(/\s+/)) {
        if (word.length > 4 && q.includes(normalize(word))) score += 1;
      }

      return { topic, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => r.topic);
}

function buildAnalysis(topic: Topic): string {
  switch (topic.availability) {
    case "hosted":
      return "Puedes consultar y descargar estos datos directamente desde el portal.";
    case "linked":
      return `El portal de transparencia solo enlaza a ${topic.redirects_to ?? "otra fuente"}. Los datos están en la fuente enlazada.`;
    case "external_portal":
      return `Debes consultar ${topic.redirects_to ?? "el portal sectorial"}.${topic.technical_vocab ? ` Conceptos útiles: ${topic.technical_vocab.join(", ")}.` : ""}`;
    case "not_published":
      return "Esta información no está en publicidad activa. Debes ejercer el derecho de acceso y, si la respuesta es incompleta, puedes reclamar ante el Consejo de Transparencia.";
  }
}

function buildLimitations(topic: Topic): string {
  switch (topic.availability) {
    case "hosted":
      return "Verifica la fecha de actualización en la fuente original.";
    case "linked":
    case "external_portal":
      return "La búsqueda puede requerir conocer filtros técnicos o navegar varios pasos.";
    case "not_published":
      return "El proceso puede durar semanas o meses. La administración puede responder de forma incompleta.";
  }
}

function linkLabel(topic: Topic): string {
  switch (topic.availability) {
    case "hosted":
      return `Ver ${topic.name}`;
    case "linked":
      return `Ir a ${topic.redirects_to ?? "fuente enlazada"}`;
    case "external_portal":
      return `Ir a ${topic.redirects_to ?? "portal externo"}`;
    default:
      return "Ver fuente";
  }
}

export function buildAskResponse(query: string, topic: Topic): AskResponse {
  const status = availabilityToStatus(topic.availability);
  const formats = topic.data_format?.join(", ") ?? "consultar en portal";
  const source = topic.source_url ?? "no publicada";

  const response: AskResponse = {
    status,
    matchedTopics: [
      {
        id: topic.id,
        name: topic.name,
        source_url: topic.source_url,
        availability: topic.availability,
      },
    ],
    report: {
      title: topic.name,
      summary: topic.description,
      rawData: `Formato: ${formats}. Fuente: ${source}.`,
      analysis: buildAnalysis(topic),
      limitations: buildLimitations(topic),
    },
    links: topic.source_url
      ? [{ label: linkLabel(topic), url: topic.source_url }]
      : [],
  };

  if (topic.request_guide) {
    response.requestGuide = {
      steps: [
        `Confirma qué información necesitas: ${topic.name}.`,
        `Presenta la solicitud en la Sede Electrónica de ${topic.request_guide.organism}.`,
        "Guarda el número de expediente y revisa plazos (1 mes desde inicio de tramitación).",
      ],
      template: `Asunto: ${topic.request_guide.template_subject}\n\n${topic.request_guide.template_body}`,
      portalUrl: topic.request_guide.portal_url,
      organism: topic.request_guide.organism,
    };
  } else if (status === "not_found") {
    response.requestGuide = {
      steps: [
        "Describe con precisión qué información necesitas y de qué organismo.",
        "Accede a la Sede Electrónica y presenta la solicitud de acceso.",
        "Conserva el número de expediente para hacer seguimiento.",
      ],
      template: `Asunto: Solicitud de acceso a información pública\n\nEn virtud del artículo 13 de la Ley 19/2013, solicito información sobre: ${query}\n\nFormato preferido: CSV o Excel.`,
      portalUrl:
        "https://sede.administracion.gob.es/procedimientos/index/categoria/25",
      organism: "Organismo competente según la materia",
    };
  }

  return response;
}

export function buildDefaultResponse(query: string): AskResponse {
  return {
    status: "not_found",
    matchedTopics: [],
    report: {
      title: "No encontramos información publicada",
      summary:
        "No hemos identificado un dataset en publicidad activa que coincida con tu pregunta.",
      rawData: `Consulta recibida: "${query}"`,
      analysis:
        "Reformula con más detalle (organismo, tipo de dato, periodo) o inicia una solicitud de acceso.",
      limitations:
        "El catálogo cubre el portal nacional de transparencia, no todos los portales autonómicos o locales.",
    },
    links: [
      {
        label: "Solicitar acceso a información pública",
        url: "https://sede.administracion.gob.es/procedimientos/index/categoria/25",
      },
    ],
    requestGuide: {
      steps: [
        "Describe con precisión qué información necesitas.",
        "Presenta la solicitud en la Sede Electrónica.",
        "Conserva el número de expediente.",
      ],
      template: `Asunto: Solicitud de acceso a información pública\n\nEn virtud del artículo 13 de la Ley 19/2013, solicito: ${query}\n\nFormato preferido: CSV o Excel.`,
      portalUrl:
        "https://sede.administracion.gob.es/procedimientos/index/categoria/25",
      organism: "Organismo competente según la materia",
    },
  };
}

export function processAskQuery(query: string, catalog: Catalog): AskResponse {
  const trimmed = query.trim();
  if (!trimmed) return buildDefaultResponse(trimmed);

  const matches = matchTopics(trimmed, catalog.topics);
  if (matches.length === 0) return buildDefaultResponse(trimmed);

  return buildAskResponse(trimmed, matches[0]);
}
