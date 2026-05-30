import type { TopicCopy, TopicId } from "./types";
import { buildContratacionDeepLink } from "./deep-links";
import { detectEntity, buildPortadaUrl } from "./entities";

export const TOPICS: Record<TopicId, TopicCopy> = {
  retribuciones: {
    label: "Retribuciones de altos cargos",
    explanation:
      "Las retribuciones de los altos cargos se publican en el Portal de Transparencia, en la sección de retribuciones. Allí verás el sueldo y los complementos del cargo.",
    steps: [
      "Abre la sección de retribuciones en el Portal de Transparencia.",
      "Busca por el nombre del cargo (p. ej. «ministro») o por el organismo.",
      "Localiza la persona o el puesto que te interesa.",
      "Consulta la retribución anual y sus complementos.",
    ],
    searchTip:
      "Busca por el nombre del cargo (p. ej. «ministro») más que por la persona.",
  },

  contratacion: {
    label: "Plataforma de Contratación del Sector Público",
    explanation:
      "Los contratos, licitaciones y obras públicas del Estado se publican en la Plataforma de Contratación del Sector Público (PLACE), no en el Portal de Transparencia. Allí está cada expediente con su importe y adjudicatario.",
    steps: [
      "Abre PLACE y entra en «Licitaciones» → «Búsqueda de licitaciones».",
      "Escribe el objeto del contrato (p. ej. «limpieza») y, si lo conoces, el órgano de contratación.",
      "Filtra por código CPV o por tipo de contrato (servicios, suministros, obras) para acotar.",
      "Abre el expediente para ver importe, adjudicatario y documentos.",
    ],
    searchTip:
      "El CPV es el código que clasifica el objeto del contrato (p. ej. 90910000 para limpieza).",
    buildDeepLink: buildContratacionDeepLink,
  },

  subvenciones: {
    label: "Base de Datos Nacional de Subvenciones",
    explanation:
      "Las subvenciones y ayudas públicas (quién las recibe y por cuánto) se consultan en la Base de Datos Nacional de Subvenciones (BDNS), no en el Portal de Transparencia.",
    steps: [
      "Entra en el buscador de concesiones de la BDNS.",
      "Busca por beneficiario, órgano concedente o por palabra clave del objeto de la ayuda.",
      "Filtra por año y por importe para acotar los resultados.",
      "Abre la concesión para ver beneficiario, importe y finalidad.",
    ],
    searchTip:
      "Puedes buscar por el NIF o nombre del beneficiario, o por el órgano que concede la ayuda.",
  },

  bienes_patrimonio: {
    label: "Declaraciones de bienes (BOE)",
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

  casa_real: {
    label: "Transparencia — Casa Real",
    explanation:
      "La información de transparencia de la Casa Real se publica en su portal propio, no en el Portal de Transparencia del Gobierno.",
    steps: [
      "Entra en la sección de transparencia de la Casa Real.",
      "Revisa las publicaciones activas y los informes disponibles.",
      "Si no encuentras el dato, valora una solicitud de acceso al organismo competente.",
    ],
    searchTip: "Es un organismo con publicación propia; no mezcles con transparencia.gob.es.",
  },

  derecho_acceso: {
    label: "Sede Electrónica — Derecho de Acceso",
    explanation:
      "Si la información no está publicada, puedes ejercer tu derecho de acceso ante el organismo que la tenga. El Portal de Transparencia explica el procedimiento y los plazos.",
    steps: [
      "Identifica el organismo que tiene la información (ministerio, agencia, etc.).",
      "Entra en la sección de derecho de acceso del Portal de Transparencia.",
      "Presenta tu solicitud por el canal indicado (formulario, email o sede electrónica).",
      "El organismo debe responder en el plazo legal (un mes, ampliable).",
    ],
    searchTip:
      "Indica el ministerio u organismo en tu consulta para ir directamente a su sede electrónica.",
    buildDeepLink: (query: string) => {
      const entity = detectEntity(query);
      return entity ? buildPortadaUrl(entity.idAmb) : undefined;
    },
  },

  normativa_boe: {
    label: "Normativa y legislación (BOE)",
    explanation:
      "Las leyes, reales decretos y demás normas del Estado se publican en el Boletín Oficial del Estado (BOE). Es la fuente oficial para consultar legislación vigente.",
    steps: [
      "Entra en boe.es y usa el buscador de normativa.",
      "Busca por título, número de ley o palabras clave del texto.",
      "Filtra por fecha si conoces cuándo se publicó la norma.",
      "Abre el texto consolidado o la publicación original.",
    ],
    searchTip:
      "Para una ley concreta, busca por su nombre corto (p. ej. «Ley de Transparencia») o por el número oficial.",
  },

  estatales_generales: {
    label: "Organización y empleo público",
    explanation:
      "La estructura de ministerios, organismos y agencias del Estado, y parte de la información sobre empleo público, está en el Portal de Transparencia bajo publicidad activa.",
    steps: [
      "Entra en la sección de organización y empleo del Portal de Transparencia.",
      "Localiza el ministerio u organismo que te interesa.",
      "Revisa las subsecciones (estructura, personal, retribuciones si aplica).",
      "Sigue los enlaces a portales específicos si el dato está en otra fuente.",
    ],
    searchTip:
      "Si buscas sueldos de cargos concretos, puede que la sección de retribuciones sea más directa.",
  },

  hacienda: {
    label: "Derecho de acceso — Ministerio de Hacienda",
    explanation:
      "Para pedir información del Ministerio de Hacienda que no esté publicada, debes presentar una solicitud de acceso en la sede electrónica del Portal de la Transparencia, en el procedimiento del ámbito de Hacienda.",
    steps: [
      "Abre el procedimiento de derecho de acceso en la sede de transparencia (ámbito Hacienda).",
      "Identifícate con Cl@ve, certificado digital o DNI-e.",
      "Cumplimenta el formulario describiendo con claridad la información que solicitas.",
      "Guarda el resguardo de registro; podrás seguir el expediente en «Mis expedientes».",
    ],
    searchTip:
      "Indica el documento o dato concreto; no hace falta justificar el motivo de la solicitud.",
  },

  unknown: {
    label: "No lo tenemos claro todavía",
    explanation:
      "No hemos podido identificar con seguridad el portal para esta consulta. Como punto de partida, el Portal de Transparencia funciona como directorio que enlaza a muchas fuentes.",
    steps: [
      "Reformula la pregunta indicando qué tipo de información buscas (contratos, subvenciones, sueldos…).",
      "Si es sobre el Estado, empieza por el Portal de Transparencia como directorio.",
      "Si la información no está publicada, puedes ejercer tu derecho de acceso (p. ej. en pideinfo.es).",
    ],
  },
};
