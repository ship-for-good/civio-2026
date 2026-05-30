package dynamic

import (
	"bytes"
	"strings"
	"unicode/utf8"

	"github.com/PuerkitoBio/goquery"
	"github.com/civio/civio-2026/internal/models"
)

const maxTextLen = 8000

func ExtractFromHTML(html, fallbackTitle string) *models.DynamicContent {
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader([]byte(html)))
	if err != nil {
		return &models.DynamicContent{PageTitle: fallbackTitle, Text: "", Error: err.Error()}
	}

	main := doc.Find("main").First()
	if main.Length() == 0 {
		main = doc.Find(".dnt-main-content").First()
	}

	content := &models.DynamicContent{
		PageTitle: extractTitle(doc, fallbackTitle),
	}

	main.Find("iframe[src]").Each(func(_ int, s *goquery.Selection) {
		if src, ok := s.Attr("src"); ok && src != "" {
			content.IframeSrcs = append(content.IframeSrcs, src)
		}
	})

	main.Find("table").Each(func(_ int, table *goquery.Selection) {
		dt := extractTable(table)
		if len(dt.Headers) > 0 || len(dt.Rows) > 0 {
			content.Tables = append(content.Tables, dt)
		}
	})

	text := strings.TrimSpace(main.Text())
	content.Text = truncate(text, maxTextLen)

	return content
}

func extractTitle(doc *goquery.Document, fallback string) string {
	if t := strings.TrimSpace(doc.Find("h1").First().Text()); t != "" {
		return t
	}
	return fallback
}

func extractTable(table *goquery.Selection) models.DynamicTable {
	var dt models.DynamicTable
	if cap := strings.TrimSpace(table.Find("caption, .table-summary").First().Text()); cap != "" {
		dt.Caption = cap
	}

	table.Find("thead th").Each(func(_ int, th *goquery.Selection) {
		dt.Headers = append(dt.Headers, strings.TrimSpace(th.Text()))
	})

	if len(dt.Headers) == 0 {
		table.Find("tr").First().Find("th, td").Each(func(_ int, cell *goquery.Selection) {
			dt.Headers = append(dt.Headers, strings.TrimSpace(cell.Text()))
		})
	}

	table.Find("tbody tr").Each(func(_ int, tr *goquery.Selection) {
		var row []string
		tr.Find("td").Each(func(_ int, td *goquery.Selection) {
			row = append(row, strings.TrimSpace(td.Text()))
		})
		if len(row) > 0 {
			dt.Rows = append(dt.Rows, row)
		}
	})

	if len(dt.Rows) == 0 {
		table.Find("tr").Each(func(i int, tr *goquery.Selection) {
			if i == 0 && len(dt.Headers) > 0 {
				return
			}
			var row []string
			tr.Find("td").Each(func(_ int, td *goquery.Selection) {
				row = append(row, strings.TrimSpace(td.Text()))
			})
			if len(row) > 0 {
				dt.Rows = append(dt.Rows, row)
			}
		})
	}

	return dt
}

func truncate(s string, max int) string {
	s = strings.Join(strings.Fields(s), " ")
	if utf8.RuneCountInString(s) <= max {
		return s
	}
	runes := []rune(s)
	return string(runes[:max-1]) + "…"
}
