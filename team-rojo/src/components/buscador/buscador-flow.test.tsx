import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Buscador } from "./buscador";
import { buildClassificationFromTopicId } from "@/domain/buscador/classification";
import { classify } from "@/domain/buscador/classify";

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

describe("Buscador — Derecho de Acceso (flujo US-1)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockClassifyApiDynamic());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("When el ciudadano busca 'hacienda', Then muestra el atajo hacienda con entityMatch y portada", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "hacienda");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    expect(await screen.findByText("Derecho de acceso — Ministerio de Hacienda")).toBeInTheDocument();
    expect(screen.getByText(/Tu solicitud va dirigida a/i)).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute(
      "href",
      "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
    );
    expect(link).toHaveTextContent("búsqueda lista");
  });

  it("When el ciudadano busca 'solicitud acceso información Ministerio de Hacienda', Then se muestra Sede Electrónica con deepLink a Hacienda", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "solicitud acceso información Ministerio de Hacienda");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    expect(await screen.findByRole("heading", { name: /Por qué aquí/i })).toBeInTheDocument();
    expect(screen.getByText("Sede Electrónica — Derecho de Acceso")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute(
      "href",
      "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
    );
    // deep link present → shows "(búsqueda lista)"
    expect(link).toHaveTextContent("búsqueda lista");
  });

  it("When el ciudadano busca 'reclamación documentos subvenciones' sin ministerio, Then se muestra DERECHO_ACCESO sin deepLink", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    const input = screen.getByRole("textbox", { name: /Pregunta de información pública/i });
    await user.type(input, "reclamación documentos subvenciones");
    await user.click(screen.getByRole("button", { name: /Buscar/i }));

    expect(await screen.findByText("Sede Electrónica — Derecho de Acceso")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    // no deep link → falls back to portalUrl (https://transparencia.sede.gob.es)
    expect(link).toHaveAttribute("href", "https://transparencia.sede.gob.es");
    // no "(búsqueda lista)" since deepLink is undefined
    expect(link).not.toHaveTextContent("búsqueda lista");
  });

  it("When el ciudadano hace clic en chip de ejemplo de contratos, Then sigue siendo PLACE (DERECHO_ACCESO no interfiere)", async () => {
    const user = userEvent.setup();
    render(<Buscador />);

    await user.click(screen.getByText(/Contratos de limpieza del Ayuntamiento de Madrid/i));

    expect(await screen.findByText("Plataforma de Contratación del Sector Público")).toBeInTheDocument();
  });
});
