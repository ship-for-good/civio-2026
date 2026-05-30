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

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) dp[i] = [i];
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy match de un keyword contra el texto normalizado.
 * Keywords multi-palabra: solo substring exacto.
 * Keywords de una palabra: distancia Levenshtein contra cada token del texto.
 */
export function fuzzyMatchesKeyword(
  normalizedText: string,
  normalizedKeyword: string,
  threshold: number
): boolean {
  if (!normalizedKeyword) return false;
  if (normalizedKeyword.includes(" ")) {
    return normalizedText.includes(normalizedKeyword);
  }
  const words = normalizedText.split(/\s+/).filter(Boolean);
  return words.some((w) => levenshtein(w, normalizedKeyword) <= threshold);
}
