import { describe, it, expect } from "vitest";
import { parseTopicIdFromAgentText } from "./resolve-topic";

describe("parseTopicIdFromAgentText", () => {
  it("parsea topicId válido del grafo", () => {
    expect(parseTopicIdFromAgentText('{"topicId":"subvenciones"}')).toBe("subvenciones");
  });

  it("acepta unknown", () => {
    expect(parseTopicIdFromAgentText('{"topicId":"unknown"}')).toBe("unknown");
  });

  it("normaliza ids desconocidos a unknown", () => {
    expect(parseTopicIdFromAgentText('{"topicId":"inventado"}')).toBe("unknown");
  });

  it("extrae JSON dentro de texto extra", () => {
    const text = 'Clasificación: {"topicId":"contratacion"} listo.';
    expect(parseTopicIdFromAgentText(text)).toBe("contratacion");
  });

  it("devuelve null si no hay JSON", () => {
    expect(parseTopicIdFromAgentText("sin json")).toBeNull();
  });
});
