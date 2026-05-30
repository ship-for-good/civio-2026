import type { Classification } from "../../src/domain/buscador/types";
import type { EntityMatch } from "../../src/domain/buscador/entities";
import type { Page } from "@playwright/test";

export const MINISTERIO_HACIENDA_ENTITY_ID = 101514;
export const PROC_ID = 133628;

export const HACIENDA_DERECHO_ACCESO_DEEP_LINK = `https://transparencia.sede.gob.es/procedimiento/portada?idProc=${PROC_ID}&idAmb=${MINISTERIO_HACIENDA_ENTITY_ID}`;

export function createHaciendaEntityMatch(): EntityMatch {
  return {
    idAmb: MINISTERIO_HACIENDA_ENTITY_ID,
    name: "Ministerio de Hacienda",
    portadaUrl: HACIENDA_DERECHO_ACCESO_DEEP_LINK,
    certAuthUrl: `https://transparencia.sede.gob.es/procedimiento/formulario?idProc=${PROC_ID}&idAmb=${MINISTERIO_HACIENDA_ENTITY_ID}`,
  };
}

/** v1 happy path: Marc's `hacienda` topic with entityMatch + portada deepLink. */
export function createMockClassification(
  _query: string,
  overrides?: Partial<Classification>
): Classification {
  const entityMatch = createHaciendaEntityMatch();

  return {
    topicId: "hacienda",
    portal: "DERECHO_ACCESO",
    label: "Derecho de acceso — Ministerio de Hacienda",
    portalUrl: HACIENDA_DERECHO_ACCESO_DEEP_LINK,
    routingType: "externo",
    isSpecialSection: false,
    explanation:
      "Para pedir información del Ministerio de Hacienda que no esté publicada, debes presentar una solicitud de acceso en la sede electrónica del Portal de la Transparencia, en el procedimiento del ámbito de Hacienda.",
    steps: [
      "Abre el procedimiento de derecho de acceso en la sede de transparencia (ámbito Hacienda).",
      "Identifícate con Cl@ve, certificado digital o DNI-e.",
      "Cumplimenta el formulario describiendo con claridad la información que solicitas.",
      "Guarda el resguardo de registro; podrás seguir el expediente en «Mis expedientes».",
    ],
    searchTip:
      "Indica el documento o dato concreto; no hace falta justificar el motivo de la solicitud.",
    entityMatch,
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
