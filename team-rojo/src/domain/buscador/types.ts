export type TopicId =
  | "retribuciones"
  | "contratacion"
  | "subvenciones"
  | "bienes_patrimonio"
  | "casa_real"
  | "derecho_acceso"
  | "normativa_boe"
  | "estatales_generales"
  | "unknown";

export type RoutingType = "interno" | "externo";

export type KnowledgeNode = {
  id: Exclude<TopicId, "unknown">;
  keywords: string[];
  source_url: string;
  type: RoutingType;
  is_special_section: boolean;
};

export type KeywordsConfig = {
  version: string;
  config: {
    fallback_strategy: string;
    allow_external_routing: boolean;
  };
  knowledge_graph: KnowledgeNode[];
};

export type Classification = {
  topicId: TopicId;
  portal: string;
  label: string;
  portalUrl: string;
  routingType: RoutingType;
  isSpecialSection: boolean;
  explanation: string;
  steps: string[];
  deepLink?: string;
  searchTip?: string;
};

export type TopicCopy = {
  label: string;
  explanation: string;
  steps: string[];
  searchTip?: string;
  buildDeepLink?: (query: string) => string | undefined;
};
