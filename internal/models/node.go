package models

import "time"

type PageType string

const (
	PageTypeNavigation   PageType = "navigation"
	PageTypeLeafStatic   PageType = "leaf_static"
	PageTypeLeafDynamic  PageType = "leaf_dynamic"
	PageTypeExternal     PageType = "external"
	PageTypeBuscadorEntry PageType = "buscador_entry"
)

type Node struct {
	ID               int64
	URL              string
	Path             string
	Title            string
	Description      string
	Depth            int
	PageType         PageType
	ParentID         *int64
	HTMLHash         string
	ContentUpdatedAt time.Time
	HTTPLastModified time.Time
	HTTPEtag         string
	ScrapedAt        time.Time
}

type Edge struct {
	ID     int64
	FromID int64
	ToID   int64
	Label  string
}

type NavLink struct {
	URL   string
	Label string
}

type CrawlRun struct {
	ID         int64
	StartedAt  time.Time
	FinishedAt *time.Time
	NodesFound int
	Errors     int
}

type GraphExport struct {
	Meta  ExportMeta    `json:"meta"`
	Nodes []ExportNode  `json:"nodes"`
	Edges []ExportEdge  `json:"edges"`
}

type ExportMeta struct {
	ScrapedAt  string `json:"scraped_at"`
	NodeCount  int    `json:"node_count"`
	EdgeCount  int    `json:"edge_count"`
}

type ExportNode struct {
	ID               int64  `json:"id"`
	URL              string `json:"url"`
	Title            string `json:"title"`
	Description      string `json:"description"`
	Path             string `json:"path"`
	Depth            int    `json:"depth"`
	PageType         string `json:"page_type"`
	ParentID         *int64 `json:"parent_id"`
	ContentUpdatedAt string `json:"content_updated_at,omitempty"`
	HTTPLastModified string `json:"http_last_modified,omitempty"`
	HTTPEtag         string `json:"http_etag,omitempty"`
	ScrapedAt        string `json:"scraped_at,omitempty"`
}

type ExportEdge struct {
	From  int64  `json:"from"`
	To    int64  `json:"to"`
	Label string `json:"label"`
}
