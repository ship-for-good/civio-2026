import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Buscador } from "./buscador";

describe("Buscador — el ciudadano encuentra el portal correcto", () => {
  it("Given la página de inicio, Then se muestran los chips de ejemplo en estado idle", () => {
    render(<Buscador />);
    expect(screen.getByText(/Contratos de limpieza del Ayuntamiento de Madrid/i)).toBeInTheDocument();
    expect(screen.getByText(/Subvenciones a una asociación cultural/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuánto cobra un ministro/i)).toBeInTheDocument();
    expect(screen.getByText(/Declaración de bienes de un diputado/i)).toBeInTheDocument();
    expect(screen.getByText(/Calidad del aire en mi ciudad/i)).toBeInTheDocument();
  });

  it("When el ciudadano escribe 'contratos de limpieza del ayuntamiento de madrid' y envía, Then el resultado muestra el portal de Contratación con deepLink a contrataciondelestado", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "contratos de limpieza del ayuntamiento de madrid");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    // Wait for the result card to appear — badge pill has the portal name
    expect(await screen.findByRole("heading", { name: /Por qué aquí/i })).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("contrataciondelestado"));
  });

  it("When el ciudadano hace clic en el chip 'Cuánto cobra un ministro', Then el resultado muestra el portal de Transparencia", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    await user.click(screen.getByText(/Cuánto cobra un ministro/i));

    // The portal badge pill shows the portal name
    expect(await screen.findByText("Portal de Transparencia")).toBeInTheDocument();
  });

  it("When hay un resultado y el ciudadano hace clic en '¿No es esto? Probar otra', Then vuelve al estado idle con los chips visibles", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    await user.click(screen.getByText(/Cuánto cobra un ministro/i));
    await screen.findByText("Portal de Transparencia");

    await user.click(screen.getByRole("button", { name: /¿No es esto\? Probar otra/i }));

    expect(screen.getByText(/Contratos de limpieza del Ayuntamiento de Madrid/i)).toBeInTheDocument();
  });

  it("When el ciudadano escribe una consulta sin sentido, Then el resultado muestra el portal desconocido", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "xkzjqw blargh fooblat");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    expect(await screen.findByText("No lo tenemos claro todavía")).toBeInTheDocument();
  });

  it("When el ciudadano envía un input vacío, Then no se muestra ningún resultado (estado idle)", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    const submitBtn = screen.getByRole("button", { name: /Buscar/i });
    await user.click(submitBtn);

    // chips still visible — we did not leave idle
    expect(screen.getByText(/Contratos de limpieza del Ayuntamiento de Madrid/i)).toBeInTheDocument();
  });
});
