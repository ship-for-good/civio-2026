import { describe, it, expect } from "vitest";
import { PORTALS, buildPlaceDeepLink } from "./portals";
import type { PortalId } from "./types";

const ALL_PORTAL_IDS: PortalId[] = [
  "PLACE",
  "BDNS",
  "TRANSPARENCIA",
  "BOE",
  "MEDIOAMBIENTAL",
  "UNKNOWN",
];

describe("PORTALS — tabla de enrutamiento", () => {
  it("contiene una entrada por cada PortalId definido", () => {
    for (const id of ALL_PORTAL_IDS) {
      expect(PORTALS).toHaveProperty(id);
    }
  });

  it("cada entrada tiene portalName no vacío", () => {
    for (const id of ALL_PORTAL_IDS) {
      expect(PORTALS[id].portalName.length).toBeGreaterThan(0);
    }
  });

  it("cada entrada tiene explanation no vacía", () => {
    for (const id of ALL_PORTAL_IDS) {
      expect(PORTALS[id].explanation.length).toBeGreaterThan(0);
    }
  });

  it("cada entrada tiene entre 3 y 5 pasos", () => {
    for (const id of ALL_PORTAL_IDS) {
      const { steps } = PORTALS[id];
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps.length).toBeLessThanOrEqual(5);
    }
  });
});

describe("buildPlaceDeepLink", () => {
  it("genera una URL que comienza con https://", () => {
    const url = buildPlaceDeepLink("limpieza");
    expect(url).toMatch(/^https:\/\//);
  });

  it("incluye la consulta codificada en la URL", () => {
    const url = buildPlaceDeepLink("limpieza");
    expect(url).toContain("limpieza");
  });

  it("codifica correctamente consultas con espacios", () => {
    const url = buildPlaceDeepLink("obra pública");
    expect(url).not.toContain(" ");
    expect(url).toContain("obra");
  });
});
