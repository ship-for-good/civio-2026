import type { Classification, PortalId } from "./types";
import { PORTALS } from "./portals";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesAny(normalizedText: string, keywords: ReadonlyArray<string>): boolean {
  return keywords.some((kw) => {
    const pattern = new RegExp(`\\b${kw}`, "i");
    return pattern.test(normalizedText);
  });
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
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

function fuzzyMatchesAny(
  normalizedText: string,
  keywords: ReadonlyArray<string>,
  threshold: number
): boolean {
  const tokens = normalizedText.split(/\s+/).filter(Boolean);
  return keywords.some((kw) =>
    tokens.some((token) => levenshtein(token, kw) <= threshold)
  );
}

const KEYWORD_RULES: ReadonlyArray<{ portal: PortalId; keywords: ReadonlyArray<string> }> = [
  {
    portal: "DERECHO_ACCESO",
    keywords: ["solicitud", "solicitar", "acceso informacion", "reclamaci", "reclamar", "pedir", "documentos"],
  },
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

export type ClassifyOptions = {
  fuzzyThreshold?: number;
};

export function classify(query: string, options?: ClassifyOptions): Classification {
  const normalizedQuery = normalize(query);

  if (normalizedQuery.trim() === "") {
    const info = PORTALS["UNKNOWN"];
    return {
      portal: "UNKNOWN",
      portalName: info.portalName,
      portalUrl: info.portalUrl,
      explanation: info.explanation,
      steps: info.steps,
    };
  }

  let matchedPortalId: PortalId | null = null;

  matchedPortalId =
    KEYWORD_RULES.find(({ keywords }) =>
      matchesAny(normalizedQuery, keywords)
    )?.portal ?? null;

  if (!matchedPortalId && options?.fuzzyThreshold && options.fuzzyThreshold > 0) {
    matchedPortalId =
      KEYWORD_RULES.find(({ keywords }) =>
        fuzzyMatchesAny(normalizedQuery, keywords, options.fuzzyThreshold!)
      )?.portal ?? null;
  }

  const finalPortal: PortalId = matchedPortalId ?? "UNKNOWN";
  const info = PORTALS[finalPortal];

  const deepLink =
    info.buildDeepLink !== undefined ? info.buildDeepLink(query) : undefined;

  return {
    portal: finalPortal,
    portalName: info.portalName,
    portalUrl: info.portalUrl,
    explanation: info.explanation,
    steps: info.steps,
    ...(info.searchTip !== undefined && { searchTip: info.searchTip }),
    ...(deepLink !== undefined && { deepLink }),
  };
}
