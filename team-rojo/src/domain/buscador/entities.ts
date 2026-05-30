const PROC_ID = 133628;

export type EntityMatch = {
  idAmb: number;
  name: string;
  portadaUrl: string;
  certAuthUrl: string;
};

const ENTITY_LIST: EntityMatch[] = [
  { idAmb: 101503, name: "Agencia Española de Protección de Datos" },
  { idAmb: 101504, name: "Casa Real" },
  { idAmb: 101505, name: "Secretaría de Estado de la Seguridad Social y Pensiones" },
  { idAmb: 101506, name: "Ministerio de Agricultura, Pesca y Alimentación" },
  { idAmb: 101507, name: "Ministerio de Asuntos Exteriores, Unión Europea y Cooperación" },
  { idAmb: 101508, name: "Ministerio de Ciencia, Innovación y Universidades" },
  { idAmb: 101509, name: "Ministerio de Cultura" },
  { idAmb: 101510, name: "Ministerio de Defensa" },
  { idAmb: 101511, name: "Ministerio de Derechos Sociales, Consumo y Agenda 2030" },
  { idAmb: 101512, name: "Ministerio de Economía, Comercio y Empresa" },
  { idAmb: 101513, name: "Ministerio de Educación, Formación Profesional y Deportes" },
  { idAmb: 101514, name: "Ministerio de Hacienda" },
  { idAmb: 101515, name: "Ministerio de Igualdad" },
  { idAmb: 101516, name: "Ministerio de Inclusión, Seguridad Social y Migraciones" },
  { idAmb: 101517, name: "Ministerio de Industria y Turismo" },
  { idAmb: 101518, name: "Ministerio del Interior" },
  { idAmb: 101519, name: "Ministerio de Juventud e Infancia" },
  { idAmb: 101520, name: "Ministerio de Política Territorial y Memoria Democrática" },
  { idAmb: 101521, name: "Ministerio de la Presidencia, Justicia, y Relaciones con Cortes" },
  { idAmb: 101522, name: "Ministerio de Sanidad" },
  { idAmb: 101523, name: "Ministerio de Trabajo y Economía Social" },
  { idAmb: 101524, name: "Ministerio para la Transformación Digital y de la Función Pública" },
  { idAmb: 101525, name: "Ministerio para la Transición Ecológica y el Reto Demográfico" },
  { idAmb: 101526, name: "Ministerio de Transportes y Movilidad Sostenible" },
  { idAmb: 101527, name: "Ministerio de Vivienda y Agenda Urbana" },
].map((e) => ({
  ...e,
  portadaUrl: `https://transparencia.sede.gob.es/procedimiento/portada?idProc=${PROC_ID}&idAmb=${e.idAmb}`,
  certAuthUrl: `https://transparencia.sede.gob.es/procedimiento/formulario?idProc=${PROC_ID}&idAmb=${e.idAmb}`,
}));

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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

function queryTokens(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

function entityTokens(entityName: string): string[] {
  return normalize(entityName).split(/\s+/).filter((t) => t.length > 3);
}

function nameMatchScore(query: string, entityName: string): number {
  const qt = queryTokens(query);
  const et = entityTokens(entityName);
  if (qt.length === 0 || et.length === 0) return 0;

  let matches = 0;
  for (const etok of et) {
    if (qt.some((qtok) => qtok === etok)) {
      matches++;
    }
  }
  return matches / et.length;
}

function fuzzyNameMatchScore(query: string, entityName: string, threshold: number): number {
  const qt = queryTokens(query);
  const et = entityTokens(entityName);
  if (qt.length === 0 || et.length === 0) return 0;

  let fuzzyMatches = 0;
  for (const etok of et) {
    if (qt.some((qtok) => levenshtein(qtok, etok) <= threshold)) {
      fuzzyMatches++;
    }
  }
  return fuzzyMatches / et.length;
}

export function detectEntity(
  query: string,
  options?: { fuzzyThreshold?: number }
): EntityMatch | null {
  if (!query.trim()) return null;

  const best: { entity: EntityMatch; score: number }[] = [];

  for (const entity of ENTITY_LIST) {
    const exactScore = nameMatchScore(query, entity.name);
    if (exactScore > 0) {
      best.push({ entity, score: exactScore });
    }
  }

  if (best.length > 0) {
    best.sort((a, b) => b.score - a.score);
    return best[0].entity;
  }

  if (options?.fuzzyThreshold && options.fuzzyThreshold > 0) {
    for (const entity of ENTITY_LIST) {
      const fuzzyScore = fuzzyNameMatchScore(query, entity.name, options.fuzzyThreshold);
      if (fuzzyScore >= 0.5) {
        best.push({ entity, score: fuzzyScore });
      }
    }
    if (best.length > 0) {
      best.sort((a, b) => b.score - a.score);
      return best[0].entity;
    }
  }

  return null;
}

/**
 * Busca una entidad por su idAmb. Útil cuando el clasificador (agente) ya
 * devuelve la entidad y solo necesitamos recuperar su URL y datos.
 */
export function findEntityById(idAmb: number): EntityMatch | null {
  return ENTITY_LIST.find((e) => e.idAmb === idAmb) ?? null;
}

export function buildPortadaUrl(idAmb: number): string {
  return `https://transparencia.sede.gob.es/procedimiento/portada?idProc=${PROC_ID}&idAmb=${idAmb}`;
}

export function buildCertAuthUrl(idAmb: number): string {
  return `https://transparencia.sede.gob.es/procedimiento/formulario?idProc=${PROC_ID}&idAmb=${idAmb}`;
}
