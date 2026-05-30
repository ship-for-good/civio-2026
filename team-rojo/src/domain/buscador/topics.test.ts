import { describe, it, expect } from "vitest";
import { TOPICS } from "./topics";
import type { TopicId } from "./types";
import { buildContratacionDeepLink } from "./deep-links";

const GRAPH_TOPIC_IDS: TopicId[] = [
  "retribuciones",
  "contratacion",
  "subvenciones",
  "bienes_patrimonio",
  "casa_real",
  "derecho_acceso",
  "normativa_boe",
  "estatales_generales",
  "unknown",
];

describe("TOPICS — copy por tema", () => {
  it("contiene una entrada por cada TopicId", () => {
    for (const id of GRAPH_TOPIC_IDS) {
      expect(TOPICS).toHaveProperty(id);
    }
  });

  it("cada entrada tiene label y explanation no vacíos", () => {
    for (const id of GRAPH_TOPIC_IDS) {
      expect(TOPICS[id].label.length).toBeGreaterThan(0);
      expect(TOPICS[id].explanation.length).toBeGreaterThan(0);
    }
  });

  it("cada entrada tiene entre 3 y 5 pasos", () => {
    for (const id of GRAPH_TOPIC_IDS) {
      const { steps } = TOPICS[id];
      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps.length).toBeLessThanOrEqual(5);
    }
  });
});

describe("buildContratacionDeepLink", () => {
  it("genera una URL https con la consulta codificada", () => {
    const url = buildContratacionDeepLink("limpieza");
    expect(url).toMatch(/^https:\/\//);
    expect(url).toContain("limpieza");
  });

  it("codifica espacios", () => {
    const url = buildContratacionDeepLink("obra pública");
    expect(url).not.toContain(" ");
  });
});
