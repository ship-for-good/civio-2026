import { describe, it, expect } from "vitest";
import { classify } from "./classify";

describe("classify — clasificador determinista de consultas ciudadanas", () => {
  describe("PLACE — contratos y licitaciones", () => {
    it("Given 'contratos de limpieza del Ayuntamiento de Madrid', When se clasifica, Then el portal es PLACE y tiene deepLink definido", () => {
      const result = classify("contratos de limpieza del Ayuntamiento de Madrid");
      expect(result.portal).toBe("PLACE");
      expect(result.deepLink).toBeDefined();
    });

    it("Given una consulta sobre licitación, When se clasifica, Then el portal es PLACE", () => {
      const result = classify("licitación de obras en el municipio");
      expect(result.portal).toBe("PLACE");
    });

    it("Given una consulta sobre adjudicación, When se clasifica, Then el portal es PLACE", () => {
      const result = classify("adjudicación del contrato de seguridad");
      expect(result.portal).toBe("PLACE");
    });
  });

  describe("BDNS — subvenciones y ayudas", () => {
    it("Given 'subvenciones a una asociación cultural', When se clasifica, Then el portal es BDNS y deepLink no está definido", () => {
      const result = classify("subvenciones a una asociación cultural");
      expect(result.portal).toBe("BDNS");
      expect(result.deepLink).toBeUndefined();
    });

    it("Given una consulta sobre ayudas, When se clasifica, Then el portal es BDNS", () => {
      const result = classify("ayudas para autónomos en 2024");
      expect(result.portal).toBe("BDNS");
    });

    it("Given una consulta sobre becas, When se clasifica, Then el portal es BDNS", () => {
      const result = classify("beca de investigación del ministerio");
      expect(result.portal).toBe("BDNS");
    });
  });

  describe("TRANSPARENCIA — retribuciones y sueldos", () => {
    it("Given 'cuánto cobra un ministro', When se clasifica, Then el portal es TRANSPARENCIA", () => {
      const result = classify("cuánto cobra un ministro");
      expect(result.portal).toBe("TRANSPARENCIA");
    });

    it("Given una consulta sobre sueldo, When se clasifica, Then el portal es TRANSPARENCIA", () => {
      const result = classify("sueldo del alcalde de Sevilla");
      expect(result.portal).toBe("TRANSPARENCIA");
    });

    it("Given una consulta sobre salario, When se clasifica, Then el portal es TRANSPARENCIA", () => {
      const result = classify("salario de los diputados");
      expect(result.portal).toBe("TRANSPARENCIA");
    });
  });

  describe("BOE — declaración de bienes y patrimonio", () => {
    it("Given 'declaración de bienes de un diputado', When se clasifica, Then el portal es BOE", () => {
      const result = classify("declaración de bienes de un diputado");
      expect(result.portal).toBe("BOE");
    });

    it("Given una consulta sobre patrimonio de un cargo, When se clasifica, Then el portal es BOE", () => {
      const result = classify("patrimonio del presidente del gobierno");
      expect(result.portal).toBe("BOE");
    });
  });

  describe("MEDIOAMBIENTAL — información ambiental", () => {
    it("Given 'calidad del aire en mi ciudad', When se clasifica, Then el portal es MEDIOAMBIENTAL", () => {
      const result = classify("calidad del aire en mi ciudad");
      expect(result.portal).toBe("MEDIOAMBIENTAL");
    });

    it("Given una consulta sobre contaminación, When se clasifica, Then el portal es MEDIOAMBIENTAL", () => {
      const result = classify("contaminación del río en mi municipio");
      expect(result.portal).toBe("MEDIOAMBIENTAL");
    });

    it("Given una consulta sobre residuos, When se clasifica, Then el portal es MEDIOAMBIENTAL", () => {
      const result = classify("gestión de residuos industriales");
      expect(result.portal).toBe("MEDIOAMBIENTAL");
    });
  });

  describe("UNKNOWN — consultas sin clasificar", () => {
    it("Given una cadena vacía, When se clasifica, Then el portal es UNKNOWN", () => {
      const result = classify("");
      expect(result.portal).toBe("UNKNOWN");
    });

    it("Given una consulta sin sentido, When se clasifica, Then el portal es UNKNOWN", () => {
      const result = classify("xkzjqw blargh fooblat");
      expect(result.portal).toBe("UNKNOWN");
    });

    it("Given solo espacios en blanco, When se clasifica, Then el portal es UNKNOWN", () => {
      const result = classify("   ");
      expect(result.portal).toBe("UNKNOWN");
    });
  });

  describe("Normalización de acentos", () => {
    it("'subvención' (con acento) y 'subvencion' (sin acento) clasifican igual a BDNS", () => {
      const withAccent = classify("subvención cultural");
      const withoutAccent = classify("subvencion cultural");
      expect(withAccent.portal).toBe("BDNS");
      expect(withoutAccent.portal).toBe("BDNS");
    });

    it("'licitación' (con acento) y 'licitacion' (sin acento) clasifican igual a PLACE", () => {
      const withAccent = classify("licitación de servicios");
      const withoutAccent = classify("licitacion de servicios");
      expect(withAccent.portal).toBe("PLACE");
      expect(withoutAccent.portal).toBe("PLACE");
    });
  });

  describe("Estructura del resultado — Classification completo", () => {
    it("el resultado siempre contiene portalName, portalUrl, explanation y steps", () => {
      const result = classify("contratos municipales");
      expect(result.portalName).toBeTruthy();
      expect(result.portalUrl).toBeTruthy();
      expect(result.explanation).toBeTruthy();
      expect(result.steps.length).toBeGreaterThanOrEqual(3);
    });

    it("el resultado de PLACE incluye deepLink con la consulta", () => {
      const query = "obra publica autopista";
      const result = classify(query);
      expect(result.portal).toBe("PLACE");
      expect(result.deepLink).toContain("autopista");
    });
  });

  describe("Prioridad de clasificación", () => {
    it("cuando hay palabras de PLACE y BDNS, PLACE gana (mayor prioridad)", () => {
      const result = classify("contrato de subvención mixto");
      expect(result.portal).toBe("PLACE");
    });
  });
});
