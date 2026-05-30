import type { Classification, PortalId } from "./types";
import { PORTALS } from "./portals";

/**
 * Normaliza una cadena de texto para la comparación: minúsculas + sin diacríticos.
 * Esto permite que "subvención" y "subvencion" sean equivalentes.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Comprueba si alguna de las palabras clave (stems) aparece en el texto normalizado
 * como inicio de palabra (límite izquierdo de palabra \b).
 * Esto evita falsos positivos como "obra" dentro de "cobra".
 */
function matchesAny(normalizedText: string, keywords: ReadonlyArray<string>): boolean {
  return keywords.some((kw) => {
    // \b asegura límite izquierdo; el stem puede estar en el interior de la palabra
    // (p. ej. "licitaci" coincide con "licitación").
    const pattern = new RegExp(`\\b${kw}`, "i");
    return pattern.test(normalizedText);
  });
}

/**
 * Listas de palabras clave por portal, en orden de prioridad (primera coincidencia gana).
 * Cada entrada es una raíz de palabra (stem parcial) anclada al inicio de palabra con \b.
 * Se definen como constantes para que sean fáciles de extender sin tocar la lógica.
 */
const KEYWORD_RULES: ReadonlyArray<{ portal: PortalId; keywords: ReadonlyArray<string> }> = [
  {
    portal: "PLACE",
    keywords: ["contrat", "licitaci", "obra", "adjudicaci", "pliego", "cpv", "suministro"],
  },
  {
    portal: "BDNS",
    keywords: ["subvenci", "ayuda", "beca", "subsidio"],
  },
  {
    portal: "TRANSPARENCIA",
    keywords: ["retribuci", "sueldo", "salario", "cobra", "nomina", "remuneraci"],
  },
  {
    portal: "BOE",
    keywords: ["declaraci", "bienes", "patrimonio"],
  },
  {
    portal: "MEDIOAMBIENTAL",
    keywords: ["medioambient", "ambiental", "aire", "contaminaci", "agua", "residuo", "emision"],
  },
];

/**
 * Clasifica la consulta de un ciudadano en lenguaje natural y la enruta al portal
 * de información pública español correspondiente.
 *
 * El algoritmo es determinista y sin dependencias de red: ideal para MVP y para
 * ser sustituido por un clasificador LLM detrás del mismo contrato `Classification`.
 */
export function classify(query: string): Classification {
  const normalizedQuery = normalize(query);

  const matchedPortalId: PortalId =
    normalizedQuery.trim() === ""
      ? "UNKNOWN"
      : (KEYWORD_RULES.find(({ keywords }) =>
          matchesAny(normalizedQuery, keywords)
        )?.portal ?? "UNKNOWN");

  const info = PORTALS[matchedPortalId];

  return {
    portal: matchedPortalId,
    portalName: info.portalName,
    portalUrl: info.portalUrl,
    explanation: info.explanation,
    steps: info.steps,
    ...(info.searchTip !== undefined && { searchTip: info.searchTip }),
    ...(info.buildDeepLink !== undefined && { deepLink: info.buildDeepLink(query) }),
  };
}
