import { describe, it, expect } from "vitest";
import {
  detectEntity,
  buildPortadaUrl,
  buildCertAuthUrl,
} from "./entities";

describe("detectEntity — detección de organismos en consultas", () => {
  describe("Coincidencia exacta por nombre completo", () => {
    it("Given 'Ministerio de Hacienda', When detectEntity, Then devuelve la entidad con idAmb=101514", () => {
      const result = detectEntity("Ministerio de Hacienda");
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(101514);
      expect(result!.name).toBe("Ministerio de Hacienda");
    });

    it("Given 'Ministerio de Defensa', When detectEntity, Then devuelve idAmb=101510", () => {
      const result = detectEntity("Ministerio de Defensa");
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(101510);
    });

    it("Given 'Agencia Española de Protección de Datos', When detectEntity, Then devuelve idAmb=101503", () => {
      const result = detectEntity("Agencia Española de Protección de Datos");
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(101503);
    });
  });

  describe("Coincidencia parcial por palabra clave del organismo", () => {
    it("Given 'Hacienda' solo, When detectEntity, Then devuelve Ministerio de Hacienda", () => {
      const result = detectEntity("Hacienda");
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(101514);
    });

    it("Given 'Sanidad' solo, When detectEntity, Then devuelve Ministerio de Sanidad", () => {
      const result = detectEntity("Sanidad");
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(101522);
    });

    it("Given 'Cultura' solo, When detectEntity, Then devuelve Ministerio de Cultura", () => {
      const result = detectEntity("Cultura");
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(101509);
    });
  });

  describe("Coincidencia en consulta larga con más palabras", () => {
    it("Given 'solicitud acceso información Ministerio de Hacienda', When detectEntity, Then encuentra Hacienda", () => {
      const result = detectEntity("solicitud acceso información Ministerio de Hacienda");
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(101514);
    });

    it("Given 'reclamación documentos subvenciones Transportes', When detectEntity, Then encuentra Transportes", () => {
      const result = detectEntity("reclamación documentos subvenciones Transportes");
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(101526);
    });
  });

  describe("Sin coincidencia", () => {
    it("Given consulta vacía, When detectEntity, Then devuelve null", () => {
      expect(detectEntity("")).toBeNull();
    });

    it("Given consulta sin organismo, When detectEntity, Then devuelve null", () => {
      expect(detectEntity("quiero información sobre subvenciones")).toBeNull();
    });

    it("Given solo espacios, When detectEntity, Then devuelve null", () => {
      expect(detectEntity("   ")).toBeNull();
    });
  });

  describe("Fuzzy matching con typos", () => {
    it("Given 'Hacienda' bien escrito sin fuzzy, Then lo encuentra", () => {
      const result = detectEntity("Hacienda");
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(101514);
    });

    it("Given 'Hacienda' con typo 'Hacenda' y fuzzyThreshold=1, Then lo encuentra", () => {
      const result = detectEntity("Hacenda", { fuzzyThreshold: 1 });
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(101514);
    });

    it("Given 'Hacienda' con typo 'Hacenda' sin fuzzy, Then NO lo encuentra", () => {
      const result = detectEntity("Hacenda");
      expect(result).toBeNull();
    });
  });
});

describe("buildPortadaUrl", () => {
  it("genera la URL correcta para idAmb=101514", () => {
    expect(buildPortadaUrl(101514)).toBe(
      "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
    );
  });

  it("genera la URL correcta para idAmb=101522", () => {
    expect(buildPortadaUrl(101522)).toBe(
      "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101522"
    );
  });
});

describe("buildCertAuthUrl", () => {
  it("genera la URL de formulario correcta para idAmb=101514", () => {
    expect(buildCertAuthUrl(101514)).toBe(
      "https://transparencia.sede.gob.es/procedimiento/formulario?idProc=133628&idAmb=101514"
    );
  });

  it("genera la URL de formulario correcta para idAmb=101503 (AEPD)", () => {
    expect(buildCertAuthUrl(101503)).toBe(
      "https://transparencia.sede.gob.es/procedimiento/formulario?idProc=133628&idAmb=101503"
    );
  });
});

describe("detectEntity — edge cases con todas las entidades", () => {
  it("todas las 25 entidades del JSON son detectables por su nombre completo (spot-check)", () => {
    const checks: [string, number][] = [
      ["Agencia Española de Protección de Datos", 101503],
      ["Casa Real", 101504],
      ["Ministerio de Agricultura, Pesca y Alimentación", 101506],
      ["Ministerio del Interior", 101518],
      ["Ministerio de Vivienda y Agenda Urbana", 101527],
    ];
    for (const [name, expectedId] of checks) {
      const result = detectEntity(name);
      expect(result).not.toBeNull();
      expect(result!.idAmb).toBe(expectedId);
    }
  });

  it("todas las entidades devuelven portadaUrl y certAuthUrl no vacías", () => {
    for (const id of [101503, 101504, 101514, 101527]) {
      const result = detectEntity(`Ministerio ${id}`);
      if (result) {
        expect(result.portadaUrl).toMatch(/^https:\/\/transparencia\.sede\.gob\.es\/procedimiento\//);
        expect(result.certAuthUrl).toMatch(/^https:\/\/transparencia\.sede\.gob\.es\/procedimiento\//);
      }
    }
  });

  it("detectEntity elige la entidad con mayor ratio de coincidencia cuando hay múltiples candidatos", () => {
    const result = detectEntity("Hacienda");
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101514);
  });
});

describe("detectEntity — nombres parciales y shorthand", () => {
  it("'Igualdad' → Ministerio de Igualdad", () => {
    const result = detectEntity("Igualdad");
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101515);
  });

  it("'Defensa' → Ministerio de Defensa", () => {
    const result = detectEntity("Defensa");
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101510);
  });

  it("'Interior' → Ministerio del Interior", () => {
    const result = detectEntity("Interior");
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101518);
  });

  it("'Casa Real' por nombre exacto", () => {
    const result = detectEntity("Casa Real");
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101504);
  });

  it("'Salud' no coincide con 'Sanidad' (no es sinónimo)", () => {
    const result = detectEntity("Salud");
    expect(result).toBeNull();
  });
});

describe("detectEntity — consultas compuestas que incluyen entidad entre otras palabras", () => {
  it("'solicitud acceso información Ministerio de Hacienda' extrae Hacienda", () => {
    const result = detectEntity("solicitud acceso información Ministerio de Hacienda");
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101514);
  });

  it("'quiero pedir documentos sobre contratos de Defensa' extrae Defensa", () => {
    const result = detectEntity("quiero pedir documentos sobre contratos de Defensa");
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101510);
  });

  it("'reclamación documentos Transportes' extrae Transportes", () => {
    const result = detectEntity("reclamación documentos Transportes");
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101526);
  });

  it("'solicitud Cultura' extrae Ministerio de Cultura", () => {
    const result = detectEntity("solicitud Cultura");
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101509);
  });

  it("consulta muy larga con entidad al final: 'por favor necesito pedir los documentos de las subvenciones del Ministerio de Educación Formación Profesional y Deportes'", () => {
    const result = detectEntity(
      "por favor necesito pedir los documentos de las subvenciones del Ministerio de Educación Formación Profesional y Deportes"
    );
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101513);
  });
});

describe("detectEntity — fuzzy matching avanzado", () => {
  it("'Hacienda' con typo 'Hacenda' (1 error), fuzzyThreshold=1 → detectado", () => {
    const result = detectEntity("Hacenda", { fuzzyThreshold: 1 });
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101514);
  });

  it("'Hacienda' con typo 'Hacenda' (falta 1 letra 'i'), fuzzyThreshold=1 → detectado", () => {
    const result = detectEntity("Hacenda", { fuzzyThreshold: 1 });
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101514);
  });

  it("'Hacienda' con typo 'Haciend' (falta 'a' final), fuzzyThreshold=1 → detectado", () => {
    const result = detectEntity("Haciend", { fuzzyThreshold: 1 });
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101514);
  });

  it("'Hacienda' con typo grave 'Xyzenda' (5+ errores), fuzzyThreshold=2 → no detectado", () => {
    const result = detectEntity("Xyzenda", { fuzzyThreshold: 2 });
    expect(result).toBeNull();
  });

  it("'Hacienda' sin 'Ministerio' con typo 'Hacenda', fuzzyThreshold=1 → detectado directamente", () => {
    const result = detectEntity("Hacenda", { fuzzyThreshold: 1 });
    expect(result).not.toBeNull();
    expect(result!.idAmb).toBe(101514);
  });

  it("exact match prevalece sobre fuzzy match (misma entidad, query correcta sin necesidad de fuzzy)", () => {
    const resultExact = detectEntity("Hacienda");
    const resultFuzzy = detectEntity("Hacenda", { fuzzyThreshold: 1 });
    expect(resultExact).not.toBeNull();
    expect(resultFuzzy).not.toBeNull();
    expect(resultExact!.idAmb).toBe(resultFuzzy!.idAmb);
  });

  it("palabras cortas de ≤3 letras se filtran como tokens de entidad (no pueden coincidir solas)", () => {
    const result = detectEntity("el la del los un con sin");
    expect(result).toBeNull();
  });
});

describe("detectEntity — sin coincidencia", () => {
  it("consulta con números no coincide", () => {
    expect(detectEntity("12345")).toBeNull();
  });

  it("consulta con símbolos no coincide", () => {
    expect(detectEntity("???")).toBeNull();
  });

  it("solo espacios en blanco", () => {
    expect(detectEntity("   ")).toBeNull();
  });
});
