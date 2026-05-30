package models

// DynamicContent holds data extracted from a page rendered with Playwright.
type DynamicContent struct {
	ScrapedAt  string         `json:"scraped_at"`
	PageTitle  string         `json:"page_title,omitempty"`
	Text       string         `json:"text,omitempty"`
	Tables     []DynamicTable `json:"tables,omitempty"`
	IframeSrcs []string       `json:"iframe_srcs,omitempty"`
	Error      string         `json:"error,omitempty"`
}

type DynamicTable struct {
	Caption string     `json:"caption,omitempty"`
	Headers []string   `json:"headers"`
	Rows    [][]string `json:"rows"`
}
