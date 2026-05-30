import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { TRANSPARENCIA_SYSTEM_PROMPT } from "./transparencia-prompt";
import type { Contrato } from "./contratos";
import zaragozaData from "./data/zaragoza.json";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

// Dataset local (sin red, sin caché). Index = id estable para citar.
const CONTRATOS: Contrato[] = (zaragozaData as { contratos: Contrato[] }).contratos ?? [];

// Versión compacta que ve el modelo. Cada línea = un contrato con su id.
// Solo campos esenciales para cumplir las 4 reglas de oro sin inflar el contexto.
const CATALOGO_COMPACTO = CONTRATOS.map((c, i) => {
  const importe = Number.isFinite(c.importe) ? Math.round(c.importe) : 0;
  const adj = c.adjudicatario?.trim() || "(sin adjudicatario)";
  return `[${i}] ${c.fecha} · ${importe}€ · ${c.tipo_contrato} · CPV ${c.cpv} · ${c.organo} · ${adj} · ${c.objeto}`;
}).join("\n");

const REGLAS_DE_ORO = `# REGLAS DE ORO (NO NEGOCIABLES)

1. **Cita siempre la fuente oficial.** Toda cifra, adjudicatario o fecha que menciones debe corresponder a un contrato del catálogo y aparecer en \`contratos_citados\`. La tarjeta enlaza al expediente; no inventes URLs.
2. **No inventes.** Si el dato no está en el catálogo, di "no consta en los datos disponibles". Nunca completes importes, nombres o resultados "a ojo".
3. **No hagas periodismo ni textos legales.** Orientas, extraes y explicas datos públicos. No redactas noticias, opiniones, recursos ni alegaciones.
4. **Traduce la jerga.** El usuario no sabe qué es un CPV ni un "contrato de suministro". Explícalo en lenguaje normal y luego cita el dato.

# DATOS DISPONIBLES

Tienes un único dataset: contratos publicados en PLACSP del **Ayuntamiento de Zaragoza** (y organismos dependientes) con CPV 45* (obras), año 2024-2025. Total: ${CONTRATOS.length} contratos.

Si el usuario pregunta por otro órgano (Madrid, Barcelona, Sanidad, etc.) o por otra categoría (servicios, suministros), dilo claramente: "En esta demo solo tengo contratos de obras del Ayuntamiento de Zaragoza".

# CATÁLOGO (id · fecha · importe · tipo · cpv · órgano · adjudicatario · objeto)

${CATALOGO_COMPACTO}

# CÓMO RESPONDER

Llama SIEMPRE a la herramienta \`responder_ciudadano\` con:
- \`reply\`: tu respuesta en lenguaje claro (2-6 frases). Si citas cifras o adjudicatarios, deben venir de contratos que incluyas en \`contratos_citados\`.
- \`contratos_citados\`: array con los **ids** (números entre corchetes del catálogo) de los contratos relevantes. Máximo 8. Si no hay coincidencias, devuelve array vacío y explícalo en \`reply\`.`;

const TOOL_RESPONDER = {
  type: "function" as const,
  function: {
    name: "responder_ciudadano",
    description:
      "Devuelve la respuesta final al ciudadano junto con los ids de los contratos del catálogo que la justifican.",
    parameters: {
      type: "object",
      properties: {
        reply: {
          type: "string",
          description: "Respuesta en lenguaje claro, sin jerga. 2-6 frases.",
        },
        contratos_citados: {
          type: "array",
          description:
            "Ids (índices del catálogo, entre 0 y N-1) de los contratos relevantes. Vacío si no hay match.",
          items: { type: "integer", minimum: 0 },
          maxItems: 8,
        },
      },
      required: ["reply", "contratos_citados"],
      additionalProperties: false,
    },
  },
};

const inputSchema = z.object({
  mensaje: z.string().min(1).max(2000),
  historial: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(40)
    .default([]),
});

export const chat = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY no está configurada.");
    }

    const messages = [
      { role: "system", content: REGLAS_DE_ORO },
      { role: "system", content: TRANSPARENCIA_SYSTEM_PROMPT },
      ...data.historial.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.mensaje },
    ];

    const res = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools: [TOOL_RESPONDER],
        tool_choice: { type: "function", function: { name: "responder_ciudadano" } },
      }),
    });

    if (res.status === 429) {
      throw new Error("Demasiadas peticiones. Espera un momento y prueba otra vez.");
    }
    if (res.status === 402) {
      throw new Error("Se han agotado los créditos de Lovable AI. Recarga el workspace.");
    }
    if (!res.ok) {
      const body = await res.text();
      console.error("Lovable AI error", res.status, body);
      throw new Error(`Error del modelo (${res.status})`);
    }

    const json = await res.json();
    const msg = json.choices?.[0]?.message;
    const call = msg?.tool_calls?.[0];

    let reply = "";
    let ids: number[] = [];

    if (call?.function?.arguments) {
      try {
        const parsed = JSON.parse(call.function.arguments);
        reply = typeof parsed.reply === "string" ? parsed.reply : "";
        if (Array.isArray(parsed.contratos_citados)) {
          ids = parsed.contratos_citados
            .filter((n: unknown) => typeof n === "number" && Number.isInteger(n))
            .filter((n: number) => n >= 0 && n < CONTRATOS.length);
        }
      } catch (e) {
        console.error("No se pudo parsear tool_call", e);
      }
    } else if (msg?.content) {
      reply = String(msg.content);
    }

    const contratos = ids.map((i) => CONTRATOS[i]);

    return {
      reply: reply.trim() || "No he podido generar una respuesta.",
      contratos,
    };
  });
