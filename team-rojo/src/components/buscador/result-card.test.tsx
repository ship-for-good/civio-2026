import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultCard } from "./result-card";
import type { Classification } from "@/domain/buscador/types";

const UNKNOWN_STUB: Classification = {
  portal: "UNKNOWN",
  portalName: "No lo tenemos claro todavía",
  portalUrl: "https://transparencia.gob.es",
  explanation: "No hemos podido identificar con seguridad el portal para esta consulta.",
  steps: [
    "Reformula la pregunta.",
    "Empieza por el Portal de Transparencia.",
    "Ejerce tu derecho de acceso.",
  ],
};

const PLACE_STUB: Classification = {
  portal: "PLACE",
  portalName: "Plataforma de Contratación del Sector Público",
  portalUrl: "https://contrataciondelestado.es",
  explanation: "Los contratos se publican en PLACE.",
  steps: ["Abre PLACE.", "Busca por objeto.", "Filtra."],
  deepLink: "https://contrataciondelestado.es/wps/portal/plataforma?text=limpieza",
  searchTip: "El CPV clasifica el objeto del contrato.",
};

describe("ResultCard — componente de presentación del resultado", () => {
  it("Given una Classification UNKNOWN sin deepLink, Then 'Ir al portal' apunta al portalUrl y no muestra '(búsqueda lista)'", () => {
    render(<ResultCard data={UNKNOWN_STUB} onReset={() => {}} />);

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute("href", "https://transparencia.gob.es");
    expect(link).not.toHaveTextContent("búsqueda lista");
  });

  it("Given una Classification PLACE con deepLink, Then 'Ir al portal' apunta al deepLink y muestra '(búsqueda lista)'", () => {
    render(<ResultCard data={PLACE_STUB} onReset={() => {}} />);

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute("href", PLACE_STUB.deepLink);
    expect(link).toHaveTextContent("búsqueda lista");
  });

  it("Given una Classification con pasos, Then se renderiza la lista ordenada de pasos", () => {
    render(<ResultCard data={UNKNOWN_STUB} onReset={() => {}} />);

    UNKNOWN_STUB.steps.forEach((step) => {
      expect(screen.getByText(step)).toBeInTheDocument();
    });
  });

  it("Given una Classification con searchTip, Then se muestra el tip con el icono 💡", () => {
    render(<ResultCard data={PLACE_STUB} onReset={() => {}} />);

    expect(screen.getByText(/CPV clasifica/i)).toBeInTheDocument();
  });

  it("When el ciudadano hace clic en '¿No es esto? Probar otra', Then llama a onReset", async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    render(<ResultCard data={UNKNOWN_STUB} onReset={onReset} />);

    await user.click(screen.getByRole("button", { name: /¿No es esto\? Probar otra/i }));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
