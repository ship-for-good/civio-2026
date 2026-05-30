import { describe, it, expect } from "vitest";
import { classify } from "./classify";
import { buildClassificationFromTopicId } from "./classification";
import { HACIENDA_ID_AMB } from "./entities";

const HACIENDA_PORTADA = `https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=${HACIENDA_ID_AMB}`;

describe("v1 happy path — Ministerio de Hacienda", () => {
  it("Given topicId hacienda (Agent 0), Then full classification listo para la UI", () => {
    const result = buildClassificationFromTopicId(
      "solicitud acceso información Ministerio de Hacienda",
      "hacienda"
    );

    expect(result.topicId).toBe("hacienda");
    expect(result.portal).toBe("DERECHO_ACCESO");
    expect(result.label).toBe("Derecho de acceso — Ministerio de Hacienda");
    expect(result.portalUrl).toBe(HACIENDA_PORTADA);
    expect(result.deepLink).toBe(HACIENDA_PORTADA);
    expect(result.entityMatch).toEqual(
      expect.objectContaining({
        idAmb: HACIENDA_ID_AMB,
        name: "Ministerio de Hacienda",
        portadaUrl: HACIENDA_PORTADA,
      })
    );
  });

  it("Given query 'hacienda' sin agente, Then classify determinista devuelve el mismo destino", () => {
    const result = classify("hacienda");

    expect(result.topicId).toBe("hacienda");
    expect(result.deepLink).toBe(HACIENDA_PORTADA);
    expect(result.entityMatch?.idAmb).toBe(HACIENDA_ID_AMB);
  });

  it("Given query larga con Hacienda sin agente, Then se promueve a topic hacienda con portada", () => {
    const result = classify("solicitud acceso información Ministerio de Hacienda");

    expect(result.topicId).toBe("hacienda");
    expect(result.deepLink).toBe(HACIENDA_PORTADA);
    expect(result.entityMatch?.name).toBe("Ministerio de Hacienda");
  });

  it("Given 'como reclamo a hacienda', Then enruta a topic hacienda con portada concreta", () => {
    const fromClassify = classify("como reclamo a hacienda");
    expect(fromClassify.topicId).toBe("hacienda");
    expect(fromClassify.deepLink).toBe(HACIENDA_PORTADA);
    expect(fromClassify.portalUrl).toBe(HACIENDA_PORTADA);

    const fromAgentTopic = buildClassificationFromTopicId(
      "como reclamo a hacienda",
      "derecho_acceso"
    );
    expect(fromAgentTopic.topicId).toBe("hacienda");
    expect(fromAgentTopic.deepLink).toBe(HACIENDA_PORTADA);
  });
});
