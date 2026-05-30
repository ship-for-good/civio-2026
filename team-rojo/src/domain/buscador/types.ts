export type PortalId =
  | "PLACE" | "BDNS" | "TRANSPARENCIA" | "BOE" | "MEDIOAMBIENTAL"
  | "DERECHO_ACCESO" | "UNKNOWN";

export type Classification = {
  portal: PortalId;
  portalName: string;
  portalUrl: string;
  explanation: string;   // 2–3 frases en español llano
  steps: string[];       // 3–5 pasos
  deepLink?: string;     // URL de búsqueda pre-rellenada cuando es posible
  searchTip?: string;
};

// Portal metadata in the routing table (everything except the per-query fields)
export type PortalInfo = {
  portalName: string;
  portalUrl: string;
  explanation: string;
  steps: string[];
  searchTip?: string;
  buildDeepLink?: (query: string) => string | undefined; // only portals where deep-linking is known
};
