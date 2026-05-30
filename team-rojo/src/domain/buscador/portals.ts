import type { PortalId, PortalInfo } from "./types";

// TODO-VERIFY: el parámetro `text` en la URL de PLACE no ha sido verificado
// contra el portal en producción. La URL base es correcta; el query-param puede
// diferir en la plataforma real.
export function buildPlaceDeepLink(query: string): string {
  const text = encodeURIComponent(query.trim());
  return `https://contrataciondelestado.es/wps/portal/plataforma?text=${text}`;
}

export const PORTALS: Record<PortalId, PortalInfo> = {
  PLACE: {
    portalName: "Plataforma de Contratación del Sector Público",
    portalUrl: "https://contrataciondelestado.es",
    explanation:
      "Los contratos, licitaciones y obras públicas del Estado se publican en la Plataforma de Contratación del Sector Público (PLACE), no en el Portal de Transparencia. Allí está cada expediente de contratación con su importe y adjudicatario.",
    steps: [
      "Abre PLACE y entra en «Licitaciones» → «Búsqueda de licitaciones».",
      "Escribe el objeto del contrato (p. ej. «limpieza») y, si lo conoces, el órgano de contratación.",
      "Filtra por código CPV o por tipo de contrato (servicios, suministros, obras) para acotar.",
      "Abre el expediente para ver importe, adjudicatario y documentos.",
    ],
    searchTip:
      "El CPV es el código que clasifica el objeto del contrato (p. ej. 90910000 para limpieza).",
    buildDeepLink: buildPlaceDeepLink,
  },

  BDNS: {
    portalName: "Base de Datos Nacional de Subvenciones",
    portalUrl: "https://www.infosubvenciones.es/bdnstrans/GE/es/index",
    explanation:
      "Las subvenciones y ayudas públicas (quién las recibe y por cuánto) se consultan en la Base de Datos Nacional de Subvenciones (BDNS/SNPSAP), no en el Portal de Transparencia.",
    steps: [
      "Entra en el buscador de concesiones de la BDNS.",
      "Busca por beneficiario, órgano concedente o por palabra clave del objeto de la ayuda.",
      "Filtra por año y por importe para acotar los resultados.",
      "Abre la concesión para ver beneficiario, importe y finalidad.",
    ],
    searchTip:
      "Puedes buscar por el NIF o nombre del beneficiario, o por el órgano que concede la ayuda.",
  },

  TRANSPARENCIA: {
    portalName: "Portal de Transparencia",
    portalUrl: "https://transparencia.gob.es",
    explanation:
      "Las retribuciones de los altos cargos sí se alojan en el Portal de Transparencia (es de los pocos datos que publica directamente). Encontrarás el sueldo y los complementos del cargo.",
    steps: [
      "Entra en el Portal de Transparencia y ve a «Publicidad activa».",
      "Busca «Altos cargos» → «Retribuciones».",
      "Localiza el cargo o la persona que te interesa.",
      "Consulta la retribución anual y sus complementos.",
    ],
    searchTip:
      "Busca por el nombre del cargo (p. ej. «ministro») más que por la persona.",
  },

  BOE: {
    portalName: "Boletín Oficial del Estado",
    portalUrl: "https://www.boe.es",
    explanation:
      "Las declaraciones de bienes y actividades de los cargos públicos se publican en el BOE. El Portal de Transparencia normalmente solo enlaza al BOE, así que conviene ir directamente a la fuente.",
    steps: [
      "Entra en el buscador del BOE (boe.es).",
      "Busca por el nombre del cargo y «declaración de bienes» o «actividades».",
      "Acota por fecha si conoces cuándo tomó posesión.",
      "Abre el anuncio para ver el detalle de la declaración.",
    ],
    searchTip:
      "En el BOE las declaraciones aparecen como anuncios; busca por nombre + «bienes».",
  },

  MEDIOAMBIENTAL: {
    portalName: "Información ambiental (derecho de acceso)",
    portalUrl: "https://www.miteco.gob.es",
    explanation:
      "La información medioambiental tiene su propia vía: a menudo no está publicada y se solicita por email o formulario al organismo competente (Ley 27/2006). Algunos datos (calidad del aire, agua) sí se publican en portales del MITECO o de tu comunidad autónoma.",
    steps: [
      "Comprueba si el dato (p. ej. calidad del aire) ya está publicado en el portal del MITECO o de tu comunidad autónoma.",
      "Si no está, identifica el organismo competente (estatal o autonómico).",
      "Presenta una solicitud de información ambiental por email o formulario.",
      "El organismo debe responder en el plazo legal (un mes, ampliable).",
    ],
    searchTip:
      "La información ambiental se rige por la Ley 27/2006: tienes derecho a pedirla aunque no esté publicada.",
  },

  UNKNOWN: {
    portalName: "No lo tenemos claro todavía",
    portalUrl: "https://transparencia.gob.es",
    explanation:
      "No hemos podido identificar con seguridad el portal para esta consulta. Como punto de partida, el Portal de Transparencia funciona como directorio que enlaza a muchas fuentes.",
    steps: [
      "Reformula la pregunta indicando qué tipo de información buscas (contratos, subvenciones, sueldos…).",
      "Si es sobre el Estado, empieza por el Portal de Transparencia como directorio.",
      "Si la información no está publicada, puedes ejercer tu derecho de acceso (p. ej. en pideinfo.es).",
    ],
  },
};
