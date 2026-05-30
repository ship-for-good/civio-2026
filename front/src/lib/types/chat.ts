export type ChatPathStep = {
  title: string;
  url: string;
};

export type ChatMatchedNode = {
  title: string;
  description: string;
  page_type: string;
};

export type ChatResponse = {
  found: boolean;
  message: string;
  hint: string;
  url: string;
  path: ChatPathStep[];
  matched_node: ChatMatchedNode | null;
};

export type ChatErrorResponse = {
  error: string;
};
