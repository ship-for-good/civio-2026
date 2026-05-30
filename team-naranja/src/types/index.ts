export type Availability =
  | "hosted"
  | "linked"
  | "external_portal"
  | "not_published";

export interface RequestGuide {
  organism: string;
  portal_url: string;
  template_subject: string;
  template_body: string;
  legal_basis: string;
  tips: string[];
}

export interface Topic {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  availability: Availability;
  source_url?: string;
  redirects_to?: string;
  data_format?: string[];
  technical_vocab?: string[];
  description: string;
  request_guide?: RequestGuide;
}

export interface Portal {
  id: string;
  name: string;
  url: string;
  last_crawled: string;
}

export interface Catalog {
  portal: Portal;
  topics: Topic[];
}

export type AskStatus = "found" | "linked" | "external" | "not_found";

export interface MatchedTopic {
  id: string;
  name: string;
  source_url?: string;
  availability: Availability;
}

export interface Report {
  title: string;
  summary: string;
  rawData: string;
  analysis: string;
  limitations: string;
}

export interface Link {
  label: string;
  url: string;
}

export interface RequestGuideResponse {
  steps: [string, string, string];
  template: string;
  portalUrl: string;
  organism: string;
}

export interface AskResponse {
  status: AskStatus;
  matchedTopics: MatchedTopic[];
  report: Report;
  links: Link[];
  requestGuide?: RequestGuideResponse;
}
