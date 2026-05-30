import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Buscador } from "./buscador";
import { buildClassificationFromTopicId } from "@/domain/buscador/classification";
import { classify } from "@/domain/buscador/classify";

const HACIENDA_PORTADA =
  "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514";

function mockClassifyApi(classification: ReturnType<typeof buildClassificationFromTopicId>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ classification, source: "cursor" }),
  });
}

function mockClassifyApiDynamic() {
  return vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
    const { query } = JSON.parse((init?.body as string) ?? "{}") as { query: string };
    const classification = classify(query);
    return {
      ok: true,
      json: async () => ({ classification, source: "deterministic" }),
    };
  });
}

describe("Buscador — demo con API Cursor (mock)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockClassifyApi(buildClassificationFromTopicId("", "unknown")));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Given la página de inicio, Then se muestran categorías de ejemplo", () => {
    render(<Buscador />);
    expect(screen.getByText("Contratos")).toBeInTheDocument();
    expect(screen.getByText("Pedir información")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Aquí la encuentras/i })).toBeInTheDocument();
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

    expect(
      await screen.findByText("Plataforma de Contratación del Sector Público")
    ).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Hacer la solicitud/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("contrataciondelestado"));
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
    expect(screen.getByText("Contratos")).toBeInTheDocument();
  });
});

describe("Buscador — Hacienda happy path", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockClassifyApiDynamic());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("When el ciudadano busca 'hacienda', Then muestra portada de Hacienda", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "hacienda");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    expect(await screen.findByText("Derecho de acceso — Ministerio de Hacienda")).toBeInTheDocument();
    expect(screen.getByText(/Tu solicitud va dirigida a/i)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Hacer la solicitud/i });
    expect(link).toHaveAttribute("href", HACIENDA_PORTADA);
  });

  it("When el ciudadano busca 'como reclamo a hacienda', Then enlaza a la portada de Hacienda", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "como reclamo a hacienda");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    expect(await screen.findByText("Derecho de acceso — Ministerio de Hacienda")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Hacer la solicitud/i });
    expect(link).toHaveAttribute("href", HACIENDA_PORTADA);
  });

  it("When el ciudadano busca 'solicitud acceso información Ministerio de Hacienda', Then enlaza a Hacienda", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "solicitud acceso información Ministerio de Hacienda");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    expect(await screen.findByText("Derecho de acceso — Ministerio de Hacienda")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Hacer la solicitud/i });
    expect(link).toHaveAttribute("href", HACIENDA_PORTADA);
  });

  it("When el ciudadano busca 'reclamación documentos subvenciones' sin ministerio, Then no hay deepLink a Hacienda", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "reclamación documentos subvenciones");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    expect(await screen.findByText("Sede Electrónica — Derecho de Acceso")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Hacer la solicitud/i });
    expect(link).toHaveAttribute("href", "https://transparencia.sede.gob.es");
  });
});
