import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultCard } from "./result-card";
import type { Classification } from "@/domain/buscador/types";

const UNKNOWN_STUB: Classification = {
  topicId: "unknown",
  label: "No lo tenemos claro todavía",
  portalUrl: "https://transparencia.gob.es",
  routingType: "interno",
  isSpecialSection: false,
  explanation: "No hemos podido identificar con seguridad el portal para esta consulta.",
  steps: [
    "Reformula la pregunta.",
    "Empieza por el Portal de Transparencia.",
    "Ejerce tu derecho de acceso.",
  ],
};

const CONTRATACION_STUB: Classification = {
  topicId: "contratacion",
  label: "Plataforma de Contratación del Sector Público",
  portalUrl: "https://contrataciondelestado.es",
  routingType: "externo",
  isSpecialSection: false,
  explanation: "Los contratos se publican en PLACE.",
  steps: ["Abre PLACE.", "Busca por objeto.", "Filtra."],
  deepLink: "https://contrataciondelestado.es/wps/portal/plataforma?text=limpieza",
  searchTip: "El CPV clasifica el objeto del contrato.",
};

describe("ResultCard — componente de presentación del resultado", () => {
  it("Given unknown sin deepLink, Then Ir al portal apunta al portalUrl", () => {
    render(<ResultCard data={UNKNOWN_STUB} onReset={() => {}} />);

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute("href", "https://transparencia.gob.es");
    expect(link).not.toHaveTextContent("búsqueda lista");
  });

  it("Given contratacion con deepLink, Then Ir al portal usa deepLink", () => {
    render(<ResultCard data={CONTRATACION_STUB} onReset={() => {}} />);

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute("href", CONTRATACION_STUB.deepLink);
    expect(link).toHaveTextContent("búsqueda lista");
  });

  it("renderiza los pasos y el searchTip", () => {
    render(<ResultCard data={CONTRATACION_STUB} onReset={() => {}} />);

    CONTRATACION_STUB.steps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
    expect(screen.getByText(/CPV clasifica/i)).toBeInTheDocument();
  });

  it("llama a onReset al pulsar Probar otra", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ResultCard data={UNKNOWN_STUB} onReset={onReset} />);

    await user.click(screen.getByRole("button", { name: /¿No es esto\? Probar otra/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
