/**
 * Normaliza una cadena de texto para la comparación: minúsculas + sin diacríticos.
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Coincide con keywords de una o varias palabras del grafo v2.
 * Frases: substring en texto normalizado. Palabras: límite de palabra \b.
 */
export function matchesKeyword(normalizedText: string, normalizedKeyword: string): boolean {
  if (!normalizedKeyword) return false;
  if (normalizedKeyword.includes(" ")) {
    return normalizedText.includes(normalizedKeyword);
  }
  return new RegExp(`\\b${escapeRegex(normalizedKeyword)}`, "i").test(normalizedText);
}
