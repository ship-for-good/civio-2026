import { describe, it, expect } from "vitest";
import { findEntityById } from "./entities";
import { buildClassificationFromTopicId } from "./classification";
import { classify } from "./classify";

const HACIENDA_PORTADA =
  "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514";

describe("findEntityById — fetch entidad por id (agente devuelve idAmb)", () => {
  it("Given idAmb 101514, Then devuelve Hacienda con su portadaUrl", () => {
    const entity = findEntityById(101514);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("Ministerio de Hacienda");
    expect(entity!.portadaUrl).toBe(HACIENDA_PORTADA);
  });

  it("Given un idAmb inexistente, Then devuelve null", () => {
    expect(findEntityById(999999)).toBeNull();
  });
});

describe("entityMatch en Classification — link + datos", () => {
  it("Given derecho_acceso con entidad en la consulta, Then adjunta entityMatch y deepLink portada", () => {
    const result = classify("solicitud acceso información Ministerio de Hacienda");

    expect(result.portal).toBe("DERECHO_ACCESO");
    expect(result.entityMatch).toBeDefined();
    expect(result.entityMatch!.idAmb).toBe(101514);
    expect(result.entityMatch!.name).toBe("Ministerio de Hacienda");
    expect(result.entityMatch!.portadaUrl).toBe(HACIENDA_PORTADA);
    expect(result.deepLink).toBe(HACIENDA_PORTADA);
  });

  it("Given el agente fija idAmb explícito, Then se recupera por id (sin depender del texto)", () => {
    const result = buildClassificationFromTopicId(
      "quiero ejercer mi derecho de acceso",
      "derecho_acceso",
      { idAmb: 101514 }
    );

    expect(result.entityMatch).toBeDefined();
    expect(result.entityMatch!.idAmb).toBe(101514);
    expect(result.deepLink).toBe(HACIENDA_PORTADA);
  });

  it("Given derecho_acceso sin entidad, Then no hay entityMatch ni deepLink", () => {
    const result = classify("solicitud acceso información");

    expect(result.portal).toBe("DERECHO_ACCESO");
    expect(result.entityMatch).toBeUndefined();
    expect(result.deepLink).toBeUndefined();
  });

  it("Given topicId hacienda (atajo del grafo), Then adjunta entityMatch y deepLink sin detectEntity", () => {
    const result = buildClassificationFromTopicId("hacienda", "hacienda");

    expect(result.topicId).toBe("hacienda");
    expect(result.portal).toBe("DERECHO_ACCESO");
    expect(result.entityMatch).toBeDefined();
    expect(result.entityMatch!.idAmb).toBe(101514);
    expect(result.entityMatch!.portadaUrl).toBe(HACIENDA_PORTADA);
    expect(result.deepLink).toBe(HACIENDA_PORTADA);
  });

  it("Given un tema que no es derecho_acceso ni hacienda, Then nunca adjunta entityMatch", () => {
    const result = classify("contratos de limpieza del ayuntamiento");

    expect(result.portal).toBe("PLACE");
    expect(result.entityMatch).toBeUndefined();
  });
});
