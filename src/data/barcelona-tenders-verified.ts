/**
 * Licitacions reals de l'Ajuntament de Barcelona (portal licitacions.bcn.cat).
 * URLs verificades el 2026-05-30; no usar IDs 9001–9015 (inexistents / ruta incorrecta).
 *
 * Format URL: https://licitacions.bcn.cat/licitacion/licitaciones/detalle?id={id}
 */

export type TenderStatus = "En curs" | "Adjudicada" | "Publicat" | "Licitació" | "Planificada";

export type BarcelonaTender = {
  id: string;
  /** Codi d'expedient al portal (quan consta a la fitxa) */
  licitacioId: string;
  /** ID numèric del portal (paràmetre ?id=) */
  portalId: number;
  title: string;
  category: string;
  municipality: string;
  organizer: string;
  status: TenderStatus;
  startDate: string;
  endDate: string;
  budget: number;
  contractType: string;
  procedureType: string;
  location: string;
  sourceUrl: string;
  lat: number;
  lng: number;
};

const portalUrl = (portalId: number) =>
  `https://licitacions.bcn.cat/licitacion/licitaciones/detalle?id=${portalId}`;

/** Estat del portal → estat de la UI */
function mapStatus(portal: "Adjudicat" | "Avaluació" | "Publicat"): TenderStatus {
  if (portal === "Adjudicat") return "Adjudicada";
  if (portal === "Avaluació") return "En curs";
  return "Publicat";
}

export const VERIFIED_BARCELONA_TENDERS: BarcelonaTender[] = [
  {
    id: "bcn-6510851",
    licitacioId: "026/601.2023.172",
    portalId: 6510851,
    title: "Serveis d'arqueologia de les obres de reurbanització de La Rambla (Santa Madrona–Canaletes)",
    category: "Contractació",
    municipality: "Barcelona",
    organizer: "Ajuntament de Barcelona — Districte de Ciutat Vella",
    status: mapStatus("Adjudicat"),
    startDate: "2023-12-19",
    endDate: "2024-02-05",
    budget: 721_390.32,
    contractType: "Serveis",
    procedureType: "Obert",
    location: "La Rambla, Ciutat Vella",
    sourceUrl: portalUrl(6510851),
    lat: 41.3765,
    lng: 2.1772,
  },
  {
    id: "bcn-11796590",
    licitacioId: "026/606.2025.015",
    portalId: 11796590,
    title: "Obres d'arranjament dels entorns del Mercat de l'Abaceria, Vila de Gràcia",
    category: "Obra pública",
    municipality: "Barcelona",
    organizer: "Barcelona d'Infraestructures Municipals (BIMSA)",
    status: mapStatus("Adjudicat"),
    startDate: "2025-07-23",
    endDate: "2025-09-12",
    budget: 373_129.15,
    contractType: "Obres",
    procedureType: "Obert",
    location: "Travessera de Gràcia, 186 (Gràcia)",
    sourceUrl: portalUrl(11796590),
    lat: 41.4046,
    lng: 2.1578,
  },
  {
    id: "bcn-14312891",
    licitacioId: "025/F250000722",
    portalId: 14312891,
    title: "Avantprojecte de reforma de la seu del Districte de Ciutat Vella (Plaça del Bonsuccés)",
    category: "Contractació",
    municipality: "Barcelona",
    organizer: "Ajuntament de Barcelona — Districte de Ciutat Vella",
    status: mapStatus("Avaluació"),
    startDate: "2026-01-09",
    endDate: "2026-01-29",
    budget: 3_842.3,
    contractType: "Serveis",
    procedureType: "Obert",
    location: "Plaça del Bonsuccés, 3",
    sourceUrl: portalUrl(14312891),
    lat: 41.3844,
    lng: 2.1699,
  },
  {
    id: "bcn-4240614",
    licitacioId: "026/609.2023.001",
    portalId: 4240614,
    title: "Obres de construcció del CEM La Sagrera (fase 1), Bonaventura Gispert 37-47",
    category: "Obra pública",
    municipality: "Barcelona",
    organizer: "Ajuntament de Barcelona",
    status: mapStatus("Avaluació"),
    startDate: "2023-01-16",
    endDate: "2023-02-13",
    budget: 8_599_921.19,
    contractType: "Obres",
    procedureType: "Obert",
    location: "Carrer Bonaventura Gispert, Sant Andreu",
    sourceUrl: portalUrl(4240614),
    lat: 41.4355,
    lng: 2.1905,
  },
  {
    id: "bcn-11474896",
    licitacioId: "026/610.2025.068",
    portalId: 11474896,
    title: "Control de qualitat del dipòsit d'aigües pluvials de la Rambla Prim (fase 2)",
    category: "Contractació",
    municipality: "Barcelona",
    organizer: "Barcelona d'Infraestructures Municipals (BIMSA)",
    status: mapStatus("Adjudicat"),
    startDate: "2025-06-11",
    endDate: "2025-07-21",
    budget: 207_982.41,
    contractType: "Serveis",
    procedureType: "Obert",
    location: "Rambla Prim, Sant Martí",
    sourceUrl: portalUrl(11474896),
    lat: 41.4011,
    lng: 2.1947,
  },
  {
    id: "bcn-5259841",
    licitacioId: "006/23001291",
    portalId: 5259841,
    title: "Conservació dels fons documentals del Centre de Documentació del Museu del Disseny",
    category: "Contractació",
    municipality: "Barcelona",
    organizer: "Institut de Cultura de Barcelona (ICUB)",
    status: mapStatus("Avaluació"),
    startDate: "2023-07-24",
    endDate: "2023-09-04",
    budget: 102_000,
    contractType: "Serveis",
    procedureType: "Obert",
    location: "Plaça de les Glòries Catalanes",
    sourceUrl: portalUrl(5259841),
    lat: 41.4024,
    lng: 2.1886,
  },
  {
    id: "bcn-8466887",
    licitacioId: "006_P2401027",
    portalId: 8466887,
    title: "Revisió lingüística i traducció (MUHBA Fabra i Coats i Casa de l'Aigua)",
    category: "Contractació",
    municipality: "Barcelona",
    organizer: "Institut de Cultura de Barcelona (ICUB)",
    status: mapStatus("Adjudicat"),
    startDate: "2024-08-26",
    endDate: "2024-09-02",
    budget: 10_600,
    contractType: "Serveis",
    procedureType: "Menor",
    location: "Carrer de Sant Adrià, 20 (Fabra i Coats)",
    sourceUrl: portalUrl(8466887),
    lat: 41.4327,
    lng: 2.1912,
  },
  {
    id: "bcn-10380559",
    licitacioId: "026/999.2025.016",
    portalId: 10380559,
    title: "Assistència tècnica d'instal·lacions d'edificació (Departaments Projectes i Obres, BIMSA)",
    category: "Contractació",
    municipality: "Barcelona",
    organizer: "Barcelona d'Infraestructures Municipals (BIMSA)",
    status: mapStatus("Avaluació"),
    startDate: "2025-04-10",
    endDate: "2025-05-12",
    budget: 89_324.93,
    contractType: "Serveis",
    procedureType: "Obert",
    location: "Barcelona (serveis corporatius BIMSA)",
    sourceUrl: portalUrl(10380559),
    lat: 41.4031,
    lng: 2.1893,
  },
  {
    id: "bcn-4586486",
    licitacioId: "026/602.2023.037",
    portalId: 4586486,
    title: "Avantprojecte dels nous Eixos Verds del programa Superilla (Sant Antoni)",
    category: "Contractació",
    municipality: "Barcelona",
    organizer: "Barcelona d'Infraestructures Municipals (BIMSA)",
    status: mapStatus("Avaluació"),
    startDate: "2023-03-22",
    endDate: "2023-05-18",
    budget: 141_679.18,
    contractType: "Serveis",
    procedureType: "Obert",
    location: "Barri de Sant Antoni, Eixample",
    sourceUrl: portalUrl(4586486),
    lat: 41.3896,
    lng: 2.1648,
  },
];
