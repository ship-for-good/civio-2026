import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GoToPortalButton } from "./go-to-portal-button";
import type { Classification } from "@/domain/buscador/types";

const DERECHO_ACCESO_WITH_ENTITY: Classification = {
  topicId: "derecho_acceso",
  portal: "DERECHO_ACCESO",
  label: "Sede Electrónica — Derecho de Acceso",
  portalUrl: "https://transparencia.sede.gob.es",
  routingType: "interno",
  isSpecialSection: false,
  explanation: "Solicitud de acceso a información pública.",
  steps: ["Haz clic en Ir al portal.", "Autentícate.", "Rellena el formulario."],
  deepLink: "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514",
  searchTip: "Indica el ministerio en tu consulta.",
};

const DERECHO_ACCESO_WITHOUT_ENTITY: Classification = {
  topicId: "derecho_acceso",
  portal: "DERECHO_ACCESO",
  label: "Sede Electrónica — Derecho de Acceso",
  portalUrl: "https://transparencia.sede.gob.es",
  routingType: "interno",
  isSpecialSection: false,
  explanation: "Solicitud de acceso a información pública.",
  steps: ["Haz clic en Ir al portal.", "Autentícate.", "Rellena el formulario."],
};

const PLACE_WITH_DEEPLINK: Classification = {
  topicId: "contratacion",
  portal: "PLACE",
  label: "Plataforma de Contratación del Sector Público",
  portalUrl: "https://contrataciondelestado.es",
  routingType: "externo",
  isSpecialSection: false,
  explanation: "Los contratos se publican en PLACE.",
  steps: ["Abre PLACE.", "Busca.", "Filtra."],
  deepLink: "https://contrataciondelestado.es/wps/portal/plataforma?text=limpieza",
};

describe("GoToPortalButton", () => {
  it("cuando deepLink existe, el href apunta al deepLink y muestra '(búsqueda lista)'", () => {
    render(<GoToPortalButton data={DERECHO_ACCESO_WITH_ENTITY} />);

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute(
      "href",
      "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
    );
    expect(link).toHaveTextContent("búsqueda lista");
  });

  it("cuando deepLink no existe, el href apunta al portalUrl y NO muestra '(búsqueda lista)'", () => {
    render(<GoToPortalButton data={DERECHO_ACCESO_WITHOUT_ENTITY} />);

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute("href", "https://transparencia.sede.gob.es");
    expect(link).not.toHaveTextContent("búsqueda lista");
  });

  it("deepLink de PLACE también se muestra correctamente", () => {
    render(<GoToPortalButton data={PLACE_WITH_DEEPLINK} />);

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute("href", PLACE_WITH_DEEPLINK.deepLink);
    expect(link).toHaveTextContent("búsqueda lista");
  });

  it("el enlace se abre en nueva pestaña con target=_blank y rel=noopener", () => {
    render(<GoToPortalButton data={DERECHO_ACCESO_WITH_ENTITY} />);

    const link = screen.getByRole("link", { name: /Ir al portal/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
