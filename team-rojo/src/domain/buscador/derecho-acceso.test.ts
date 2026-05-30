import { describe, it, expect } from "vitest";
import { classify } from "./classify";
import { detectEntity } from "./entities";

describe("Test Suite 1: Investigative Journalist (Direct Routing)", () => {
  describe("Feature: Direct routing to specific entity's Right of Access form", () => {
    it("Given 'solicitud acceso información Ministerio de Hacienda', When clasificado, Then el portal es DERECHO_ACCESO con deepLink al formulario de Hacienda", () => {
      const result = classify("solicitud acceso información Ministerio de Hacienda");

      expect(result.portal).toBe("DERECHO_ACCESO");
      expect(result.deepLink).toBeDefined();
      expect(result.deepLink).toBe(
        "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
      );
    });

    it("Given la consulta 'pedir contratos Hacienda', When clasificado, Then el portal es DERECHO_ACCESO con deepLink a Hacienda", () => {
      const result = classify("pedir contratos Hacienda");

      expect(result.portal).toBe("DERECHO_ACCESO");
      expect(result.deepLink).toBeDefined();
      expect(result.deepLink).toContain("idAmb=101514");
    });

    it("Given una consulta DERECHO_ACCESO, Then el sistema reconoce los keywords 'solicitud' y 'acceso informacion'", () => {
      const result1 = classify("solicitud acceso información Ministerio de Hacienda");
      const result2 = classify("acceso informacion datos ministerio");

      expect(result1.portal).toBe("DERECHO_ACCESO");
      expect(result2.portal).toBe("DERECHO_ACCESO");
    });

    it("Given 'solicitud acceso información Ministerio de Hacienda', Then detectEntity identifica el idAmb=101514", () => {
      const entity = detectEntity("solicitud acceso información Ministerio de Hacienda");

      expect(entity).not.toBeNull();
      expect(entity!.idAmb).toBe(101514);
      expect(entity!.name).toBe("Ministerio de Hacienda");
    });

    it("Given una consulta DERECHO_ACCESO con entidad, Then el deepLink es la portadaUrl de la Sede Electrónica", () => {
      const result = classify("solicitud acceso información Ministerio de Hacienda");

      expect(result.deepLink).toMatch(
        /^https:\/\/transparencia\.sede\.gob\.es\/procedimiento\/portada\?idProc=133628&idAmb=101514$/
      );
    });
  });
});

describe("Test Suite 2: Everyday Citizen (Interactive Routing & Error Handling)", () => {
  describe("Feature: Interactive routing for incomplete Right of Access requests", () => {
    it("Given 'reclamación documentos subvenciones' sin ministerio, When clasificado, Then el portal es DERECHO_ACCESO sin deepLink", () => {
      const result = classify("reclamación documentos subvenciones");

      expect(result.portal).toBe("DERECHO_ACCESO");
      expect(result.deepLink).toBeUndefined();
    });

    it("Given 'reclamación documentos subvenciones', Then detectEntity devuelve null (no hay entidad)", () => {
      const entity = detectEntity("reclamación documentos subvenciones");

      expect(entity).toBeNull();
    });

    it("Given una consulta DERECHO_ACCESO sin entidad, Then el sistema no genera deepLink (necesita selección)", () => {
      const result = classify("solicitud acceso información");

      expect(result.portal).toBe("DERECHO_ACCESO");
      expect(result.deepLink).toBeUndefined();
    });

    it("Given 'reclamación documentos subvenciones' no especifica ministerio, Then detectEntity no encuentra ninguna entidad", () => {
      const entity = detectEntity("reclamación documentos subvenciones");

      expect(entity).toBeNull();
    });
  });

  describe("Entity selection resolution", () => {
    it("Given se selecciona 'Ministerio de Hacienda' de la lista, Then detectEntity construye la URL con idAmb=101514", () => {
      const entity = detectEntity("Ministerio de Hacienda");

      expect(entity).not.toBeNull();
      expect(entity!.idAmb).toBe(101514);
      expect(entity!.portadaUrl).toBe(
        "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
      );
    });

    it("Given se selecciona 'Sanidad' de la lista, Then detectEntity construye la URL con idAmb=101522", () => {
      const entity = detectEntity("Sanidad");

      expect(entity).not.toBeNull();
      expect(entity!.idAmb).toBe(101522);
      expect(entity!.portadaUrl).toContain("idAmb=101522");
    });

    it("Given se selecciona 'Ministerio de Defensa', Then la URL contiene el idAmb correcto", () => {
      const entity = detectEntity("Ministerio de Defensa");

      expect(entity).not.toBeNull();
      expect(entity!.idAmb).toBe(101510);
    });
  });
});

describe("Test Suite 3: Fallback & Edge Cases", () => {
  describe("Feature: Fuzzy search fallback for typos in keywords", () => {
    it("Given 'solistud aceso Hacienda' con fuzzyThreshold=2, Then clasifica como hacienda con deepLink a Hacienda", () => {
      const result = classify("solistud aceso Hacienda", { fuzzyThreshold: 2 });

      expect(result.topicId).toBe("hacienda");
      expect(result.portal).toBe("DERECHO_ACCESO");
      expect(result.deepLink).toBeDefined();
      expect(result.deepLink).toContain("idAmb=101514");
      expect(result.entityMatch?.idAmb).toBe(101514);
    });

    it("Given 'solistud aceso Hacienda' sin fuzzy, Then clasifica como hacienda por keyword exacta", () => {
      const result = classify("solistud aceso Hacienda");

      expect(result.topicId).toBe("hacienda");
      expect(result.portal).toBe("DERECHO_ACCESO");
      expect(result.deepLink).toContain("idAmb=101514");
    });

    it("Given consulta con typos y fuzzyThreshold=2, Then detectEntity encuentra 'Hacienda' como entidad", () => {
      const entity = detectEntity("solistud aceso Hacienda", { fuzzyThreshold: 2 });

      expect(entity).not.toBeNull();
      expect(entity!.idAmb).toBe(101514);
    });
  });

  describe("Edge cases — queries sin entidad", () => {
    it("Given una consulta vacía, Then detectEntity devuelve null", () => {
      expect(detectEntity("")).toBeNull();
    });

    it("Given consulta sin keywords ni entidad, Then classify devuelve UNKNOWN", () => {
      const result = classify("consulta aleatoria sin clasificar");

      expect(result.portal).toBe("UNKNOWN");
      expect(result.deepLink).toBeUndefined();
    });
  });
});
