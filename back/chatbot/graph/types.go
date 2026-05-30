package graph

type GraphExport struct {
	Meta  ExportMeta   `json:"meta"`
	Nodes []ExportNode `json:"nodes"`
	Edges []ExportEdge `json:"edges"`
}

type ExportMeta struct {
	ScrapedAt string `json:"scraped_at"`
	NodeCount int    `json:"node_count"`
	EdgeCount int    `json:"edge_count"`
}

type ExportNode struct {
	ID               int64          `json:"id"`
	URL              string         `json:"url"`
	Title            string         `json:"title"`
	Description      string         `json:"description"`
	Path             string         `json:"path"`
	Depth            int            `json:"depth"`
	PageType         string         `json:"page_type"` // "navigation" | "leaf_static"
	ParentID         *int64         `json:"parent_id"` // null en nodos raíz
	ChildContents    []ChildContent `json:"child_contents,omitempty"`
	ScrapedAt        string         `json:"scraped_at,omitempty"`
	HTTPLastModified string         `json:"http_last_modified,omitempty"`
	HTTPEtag         string         `json:"http_etag,omitempty"`
}

type ChildContent struct {
	Title       string `json:"title"`
	URL         string `json:"url"`
	PageType    string `json:"page_type"`
	ContentKind string `json:"content_kind"`
	Description string `json:"description"`
}

type ExportEdge struct {
	From  int64  `json:"from"`
	To    int64  `json:"to"`
	Label string `json:"label"`
}
