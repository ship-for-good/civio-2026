import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Buscador } from "./buscador";
import { buildClassificationFromTopicId } from "@/domain/buscador/classification";

function mockClassifyApi(classification: ReturnType<typeof buildClassificationFromTopicId>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ classification, source: "cursor" }),
  });
}

describe("Buscador — demo con API Cursor (mock)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockClassifyApi(buildClassificationFromTopicId("", "unknown")));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Given la página de inicio, Then se muestran los chips de ejemplo en estado idle", () => {
    render(<Buscador />);
    expect(screen.getByText(/Contratos de limpieza del Ayuntamiento de Madrid/i)).toBeInTheDocument();
    expect(screen.getByText(/Subvenciones a una asociación cultural/i)).toBeInTheDocument();
    expect(screen.getByText(/Cuánto cobra un ministro/i)).toBeInTheDocument();
    expect(screen.getByText(/Declaración de bienes de un diputado/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Cómo solicitar acceso a documentos de un ministerio/i)
    ).toBeInTheDocument();
  });

  it("When envía contratos de limpieza, Then muestra resultado de contratacion", async () => {
    const classification = buildClassificationFromTopicId(
      "contratos de limpieza del ayuntamiento de madrid",
      "contratacion"
    );
    vi.stubGlobal("fetch", mockClassifyApi(classification));

    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "contratos de limpieza del ayuntamiento de madrid");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    expect(await screen.findByRole("heading", { name: /Por qué aquí/i })).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("contrataciondelestado"));
  });

  it("When clic en chip de ministro, Then muestra retribuciones", async () => {
    const classification = buildClassificationFromTopicId("cuánto cobra un ministro", "retribuciones");
    vi.stubGlobal("fetch", mockClassifyApi(classification));

    const user = userEvent.setup();
    render(<Buscador />);

    await user.click(screen.getByText(/Cuánto cobra un ministro/i));

    expect(await screen.findByText("Retribuciones de altos cargos")).toBeInTheDocument();
  });

  it("When Probar otra, Then vuelve al idle con chips", async () => {
    vi.stubGlobal(
      "fetch",
      mockClassifyApi(buildClassificationFromTopicId("cuánto cobra un ministro", "retribuciones"))
    );

    const user = userEvent.setup();
    render(<Buscador />);

    await user.click(screen.getByText(/Cuánto cobra un ministro/i));
    await screen.findByText("Retribuciones de altos cargos");

    await user.click(screen.getByRole("button", { name: /¿No es esto\? Probar otra/i }));

    expect(screen.getByText(/Contratos de limpieza del Ayuntamiento de Madrid/i)).toBeInTheDocument();
  });

  it("When la API falla, Then muestra error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "CURSOR_API_KEY no configurada" }),
      })
    );

    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "xkzjqw blargh fooblat");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    await waitFor(() => {
      expect(screen.getByText(/CURSOR_API_KEY/i)).toBeInTheDocument();
    });
  });

  it("When envía un input vacío, Then no llama a la API (estado idle)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<Buscador />);

    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Contratos de limpieza del Ayuntamiento de Madrid/i)).toBeInTheDocument();
  });
});
