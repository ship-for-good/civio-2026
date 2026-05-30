// Tipos compartidos entre frontend y server function.

export type Contrato = {
  objeto: string;
  importe: number;
  adjudicatario: string;
  cpv: string;
  tipo_contrato: string;
  fecha: string;
  estado: string;
  organo: string;
  expediente?: string;
  url_expediente: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  contratos?: Contrato[];
};

export type ChatResponse = {
  reply: string;
  contratos: Contrato[];
};
