// buscar_contratos.ts — implementación de referencia para la edge function de
// Lovable Cloud (Supabase Edge Functions, Deno/TypeScript).
//
// La edge function "chat" declara esta función como TOOL para Lovable AI (Gemini,
// function calling). Replica la lógica de buscar_contratos.py: lee el dataset
// normalizado (contratos_demo.json en Supabase Storage o generado con etl_placsp.py)
// y filtra por órgano / CPV / año. Mantiene el contrato de datos congelado.
//
// Esquema de cada contrato:
//   { objeto, importe, adjudicatario, cpv, tipo_contrato, fecha, estado,
//     organo, expediente, url_expediente }

export interface Contrato {
  objeto: string;
  importe: number | null;
  adjudicatario: string;
  cpv: string;
  tipo_contrato: string;
  fecha: string;
  estado: string;
  organo: string;
  expediente: string;
  url_expediente: string;
}

export interface BuscarArgs {
  organo?: string;
  cpv?: string;
  anio?: string;
}

export interface BuscarResult {
  contratos: Contrato[];
  n: number;
  total_importe: number;
}

function matches(rec: Contrato, { organo, cpv, anio }: BuscarArgs): boolean {
  if (organo && !(rec.organo ?? "").toLowerCase().includes(organo.toLowerCase())) {
    return false;
  }
  if (cpv && !(rec.cpv ?? "").startsWith(cpv)) return false;
  if (anio && !(rec.fecha ?? "").startsWith(anio)) return false;
  return true;
}

/**
 * Filtra el dataset de contratos. `dataset` es el array `contratos` del JSON
 * (cárgalo desde Supabase Storage una vez y cachéalo en la edge function).
 */
export function buscarContratos(dataset: Contrato[], args: BuscarArgs): BuscarResult {
  const hits = dataset.filter((rec) => matches(rec, args));
  const total = Math.round(
    hits.reduce((acc, r) => acc + (r.importe ?? 0), 0) * 100,
  ) / 100;
  return { contratos: hits, n: hits.length, total_importe: total };
}

// Definición de la TOOL para Lovable AI / Gemini (function calling):
export const buscarContratosTool = {
  name: "buscar_contratos",
  description:
    "Busca contratos públicos reales (PLACSP) por órgano de contratación, " +
    "código CPV (prefijo) y/o año. Devuelve la lista normalizada y el importe total.",
  parameters: {
    type: "object",
    properties: {
      organo: { type: "string", description: "Nombre o parte del nombre del órgano (ej. 'Ayuntamiento de Barcelona')" },
      cpv: { type: "string", description: "Código o prefijo CPV (ej. '4521' para obras educativas)" },
      anio: { type: "string", description: "Año en formato AAAA" },
    },
    required: ["organo"],
  },
} as const;
