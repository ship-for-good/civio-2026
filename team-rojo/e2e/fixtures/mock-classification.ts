import type { Classification } from "../../src/domain/buscador/types";
import type { Page } from "@playwright/test";

export const MINISTERIO_HACIENDA_ENTITY_ID = 101514;
export const PROC_ID = 133628;

export const HACIENDA_DERECHO_ACCESO_DEEP_LINK = `https://transparencia.sede.gob.es/procedimiento/portada?idProc=${PROC_ID}&idAmb=${MINISTERIO_HACIENDA_ENTITY_ID}`;

export function createMockClassification(
  query: string,
  overrides?: Partial<Classification>
): Classification {
  return {
    topicId: "derecho_acceso",
    portal: "DERECHO_ACCESO",
    label: "Sede Electrónica — Derecho de Acceso",
    portalUrl: "https://transparencia.gob.es",
    routingType: "externo",
    isSpecialSection: false,
    explanation:
      "Si la información no está publicada, puedes ejercer tu derecho de acceso ante el organismo que la tenga. El Portal de Transparencia explica el procedimiento y los plazos.",
    steps: [
      "Identifica el organismo que tiene la información (ministerio, agencia, etc.).",
      "Entra en la sección de derecho de acceso del Portal de Transparencia.",
      "Presenta tu solicitud por el canal indicado (formulario, email o sede electrónica).",
      "El organismo debe responder en el plazo legal (un mes, ampliable).",
    ],
    searchTip:
      "Indica el ministerio u organismo en tu consulta para ir directamente a su sede electrónica.",
    deepLink: HACIENDA_DERECHO_ACCESO_DEEP_LINK,
    ...overrides,
  };
}

export async function mockClassifyApi(
  page: Page,
  classification: Classification
): Promise<void> {
  await page.route("**/api/buscador/classify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ classification, source: "test-mock" }),
    });
  });
}
