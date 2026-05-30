import { describe, it, expect } from "vitest";
import { classify, normalize, matchesKeyword } from "./classify";

describe("classify — grafo v2 (keywords.json)", () => {
  describe("contratacion", () => {
    it("Given contratos de limpieza, Then topicId es contratacion con deepLink", () => {
      const result = classify(
        "contratos de limpieza del Ayuntamiento de Madrid",
      );
      expect(result.topicId).toBe("contratacion");
      expect(result.portalUrl).toBe("https://contrataciondelestado.es");
      expect(result.deepLink).toBeDefined();
    });

    it("Given licitación, Then topicId es contratacion", () => {
      expect(classify("licitación de obras en el municipio").topicId).toBe(
        "contratacion",
      );
    });
  });

  describe("subvenciones", () => {
    it("Given subvenciones culturales, Then topicId es subvenciones sin deepLink", () => {
      const result = classify("subvenciones a una asociación cultural");
      expect(result.topicId).toBe("subvenciones");
      expect(result.deepLink).toBeUndefined();
    });

    it("Given ayudas o becas, Then topicId es subvenciones", () => {
      expect(classify("ayudas para autónomos en 2024").topicId).toBe(
        "subvenciones",
      );
      expect(classify("beca de investigación del ministerio").topicId).toBe(
        "subvenciones",
      );
    });
  });

  describe("retribuciones", () => {
    it("Given sueldos o ministro, Then topicId es retribuciones", () => {
      expect(classify("cuánto cobra un ministro").topicId).toBe(
        "retribuciones",
      );
      expect(classify("sueldo del alcalde de Sevilla").topicId).toBe(
        "retribuciones",
      );
      expect(classify("salario de los diputados").topicId).toBe(
        "retribuciones",
      );
    });

    it("usa la URL de retribuciones del grafo", () => {
      const result = classify("sueldo del alcalde");
      expect(result.portalUrl).toContain("retribuciones");
      expect(result.routingType).toBe("interno");
    });
  });

  describe("bienes_patrimonio", () => {
    it("Given declaración de bienes o patrimonio, Then topicId es bienes_patrimonio", () => {
      expect(classify("declaración de bienes de un diputado").topicId).toBe(
        "bienes_patrimonio",
      );
      expect(classify("patrimonio del presidente del gobierno").topicId).toBe(
        "bienes_patrimonio",
      );
    });
  });

  describe("normativa_boe", () => {
    it("Given ley o real decreto, Then topicId es normativa_boe", () => {
      expect(classify("real decreto sobre transparencia").topicId).toBe(
        "normativa_boe",
      );
    });
  });

  describe("derecho_acceso", () => {
    it("Given solicitud de acceso, Then topicId es derecho_acceso", () => {
      expect(
        classify("pedir documentos al ministerio por derecho de acceso")
          .topicId,
      ).toBe("derecho_acceso");
    });
  });

  describe("unknown", () => {
    it("Given cadena vacía, espacios o sin sentido, Then topicId es unknown", () => {
      expect(classify("").topicId).toBe("unknown");
      expect(classify("   ").topicId).toBe("unknown");
      expect(classify("xkzjqw blargh fooblat").topicId).toBe("unknown");
    });

    it("consultas solo ambientales caen en unknown (fuera del grafo v2)", () => {
      expect(classify("calidad del aire en mi ciudad").topicId).toBe("unknown");
      expect(classify("contaminación del río en mi municipio").topicId).toBe(
        "unknown",
      );
    });
  });

  describe("Normalización de acentos", () => {
    it("subvención y subvencion clasifican igual", () => {
      expect(classify("subvención cultural").topicId).toBe("subvenciones");
      expect(classify("subvencion cultural").topicId).toBe("subvenciones");
    });

    it("licitación y licitacion clasifican igual", () => {
      expect(classify("licitación de servicios").topicId).toBe("contratacion");
      expect(classify("licitacion de servicios").topicId).toBe("contratacion");
    });
  });

  describe("Estructura Classification", () => {
    it("siempre incluye label, portalUrl, explanation y steps", () => {
      const result = classify("contratos municipales");
      expect(result.label).toBeTruthy();
      expect(result.portalUrl).toBeTruthy();
      expect(result.explanation).toBeTruthy();
      expect(result.steps.length).toBeGreaterThanOrEqual(3);
    });

    it("contratacion incluye deepLink con la consulta", () => {
      const query = "obra publica autopista";
      const result = classify(query);
      expect(result.topicId).toBe("contratacion");
      expect(result.deepLink).toContain("autopista");
    });
  });

  describe("DERECHO_ACCESO — solicitudes de acceso a información pública", () => {
    it("Given 'solicitud acceso información Ministerio de Hacienda', When se clasifica, Then el portal es DERECHO_ACCESO con deepLink al formulario de Hacienda", () => {
      const result = classify(
        "solicitud acceso información Ministerio de Hacienda",
      );
      expect(result.portal).toBe("DERECHO_ACCESO");
      expect(result.deepLink).toBe(
        "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514",
      );
    });
  });

  describe("hacienda", () => {
    it("Given hacienda, Then topicId es hacienda con URL del ámbito Hacienda", () => {
      const result = classify("hacienda");
      expect(result.topicId).toBe("hacienda");
      expect(result.portalUrl).toBe(
        "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
      );
      expect(result.routingType).toBe("externo");
    });
  });

  describe("Prioridad del grafo", () => {
    it("contrato antes que subvención en la misma frase", () => {
      expect(classify("contrato de subvención mixto").topicId).toBe("contratacion");
    });

    it("Given 'pedir documentos subvenciones', When se clasifica, Then el portal es DERECHO_ACCESO", () => {
      const result = classify("pedir documentos subvenciones");
      expect(result.portal).toBe("DERECHO_ACCESO");
    });

    it("Given 'solicitar información' sin entidad, When se clasifica, Then el portal es DERECHO_ACCESO sin deepLink", () => {
      const result = classify("solicitar información");
      expect(result.portal).toBe("DERECHO_ACCESO");
      expect(result.deepLink).toBeUndefined();
    });

    it("Given 'reclamación Sanidad', When se clasifica, Then el portal es DERECHO_ACCESO con deepLink a Sanidad", () => {
      const result = classify("reclamación Sanidad");
      expect(result.portal).toBe("DERECHO_ACCESO");
      expect(result.deepLink).toBe(
        "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101522",
      );
    });

    it("Given una consulta DERECHO_ACCESO, Then los pasos incluidos son sobre cómo presentar la solicitud", () => {
      const result = classify("pedir información al ministerio");
      expect(result.steps.length).toBeGreaterThanOrEqual(3);
      expect(result.searchTip).toContain("ministerio");
    });
  });

  describe("Prioridad de clasificación", () => {
    it("cuando hay palabras de PLACE y BDNS, PLACE gana (mayor prioridad)", () => {
      const result = classify("contrato de subvención mixto");
      expect(result.portal).toBe("PLACE");
    });

    it("DERECHO_ACCESO gana sobre BDNS: 'reclamación documentos subvenciones' va a DERECHO_ACCESO", () => {
      const result = classify("reclamación documentos subvenciones");
      expect(result.portal).toBe("DERECHO_ACCESO");
    });

    it("DERECHO_ACCESO gana sobre PLACE: 'pedir contratos Hacienda' va a DERECHO_ACCESO", () => {
      const result = classify("pedir contratos Hacienda");
      expect(result.portal).toBe("DERECHO_ACCESO");
    });

    it("PLACE gana sobre DERECHO_ACCESO cuando no hay palabra de solicitud: 'contratos de limpieza'", () => {
      const result = classify("contratos de limpieza");
      expect(result.portal).toBe("PLACE");
    });
  });

  describe("ClassifyOptions — fuzzy matching", () => {
    it("Given 'solistud aceso' con fuzzyThreshold=2, When se clasifica, Then el portal es DERECHO_ACCESO", () => {
      const result = classify("solistud aceso", { fuzzyThreshold: 2 });
      expect(result.portal).toBe("DERECHO_ACCESO");
    });

    it("Given 'solistud aceso' sin fuzzy, When se clasifica, Then el portal es UNKNOWN", () => {
      const result = classify("solistud aceso");
      expect(result.portal).toBe("UNKNOWN");
    });

    it("Given typo grave 'soliztud' con fuzzyThreshold=2, When se clasifica, Then alcanza DERECHO_ACCESO", () => {
      const result = classify("soliztud aceso", { fuzzyThreshold: 2 });
      expect(result.portal).toBe("DERECHO_ACCESO");
    });

    it("Given 'reclamaci' bien escrito, fuzzyThreshold irrelevante y portal es DERECHO_ACCESO", () => {
      const result = classify("reclamaci", { fuzzyThreshold: 2 });
      expect(result.portal).toBe("DERECHO_ACCESO");
    });

    it("Given 'cntratos' (typo fuerte en contratos) con fuzzyThreshold=3, When se clasifica, Then alcanza PLACE", () => {
      const result = classify("cntratos", { fuzzyThreshold: 3 });
      expect(result.portal).toBe("PLACE");
    });

    it("Given fuzzyThreshold=0, se comporta igual que sin fuzzy", () => {
      const resultWith = classify("solistud aceso", { fuzzyThreshold: 0 });
      const resultWithout = classify("solistud aceso");
      expect(resultWith.portal).toBe(resultWithout.portal);
    });
  });

  describe("DERECHO_ACCESO — deepLink según entidad presente/ausente", () => {
    it("con entidad explícita en la consulta, deepLink apunta a la portadaUrl del organismo", () => {
      const result = classify("solicitud información Ministerio de Defensa");
      expect(result.deepLink).toContain("idAmb=101510");
    });

    it("con entidad mencionada de forma corta, deepLink se construye igual", () => {
      const result = classify("reclamación documentos Defensa");
      expect(result.deepLink).toContain("idAmb=101510");
    });

    it("sin entidad en la consulta, deepLink es undefined", () => {
      const result = classify("solicitud acceso información");
      expect(result.deepLink).toBeUndefined();
    });
  });
});

describe("matchesKeyword", () => {
  it("no hace match de obra dentro de cobra", () => {
    const text = normalize("cuanto cobra un ministro");
    expect(matchesKeyword(text, normalize("obra"))).toBe(false);
  });

  it("hace match de frases multi-palabra", () => {
    const text = normalize("derecho de acceso a documentos");
    expect(matchesKeyword(text, normalize("derecho de acceso"))).toBe(true);
  });
});
