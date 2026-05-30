package parser

import (
	"bytes"
	"strings"
	"unicode/utf8"

	"github.com/PuerkitoBio/goquery"
)

const maxDescriptionLen = 600

func ExtractPageDescription(html []byte) string {
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(html))
	if err != nil {
		return ""
	}

	if desc := metaContent(doc, `meta[name="description"]`); desc != "" {
		return truncateDescription(desc)
	}
	if desc := metaContent(doc, `meta[property="og:description"]`); desc != "" {
		return truncateDescription(desc)
	}

	main := doc.Find("main").First()
	if main.Length() == 0 {
		main = doc.Find(".dnt-main-content").First()
	}

	var parts []string
	main.Find(".cmp-text").EachWithBreak(func(_ int, sel *goquery.Selection) bool {
		text := normalizeWhitespace(sel.Text())
		if text == "" || len(text) < 20 {
			return true
		}
		parts = append(parts, text)
		return len(parts) < 3
	})

	if len(parts) == 0 {
		main.Find("p").EachWithBreak(func(_ int, sel *goquery.Selection) bool {
			text := normalizeWhitespace(sel.Text())
			if text == "" || len(text) < 20 {
				return true
			}
			parts = append(parts, text)
			return len(parts) < 2
		})
	}

	if len(parts) > 0 {
		return truncateDescription(strings.Join(parts, " "))
	}

	return ""
}

func ContextDescription(title, parentTitle string, pageType string) string {
	title = CleanLabel(title)
	if title == "" {
		return ""
	}

	switch {
	case parentTitle != "":
		return truncateDescription(title + " — sección dentro de " + CleanLabel(parentTitle) + " en Publicidad Activa del Portal de Transparencia.")
	case pageType == "buscador_entry":
		return truncateDescription(title + " — punto de acceso al buscador de registros de Publicidad Activa.")
	default:
		return truncateDescription(title + " — sección de Publicidad Activa en transparencia.gob.es.")
	}
}

func metaContent(doc *goquery.Document, selector string) string {
	content, exists := doc.Find(selector).First().Attr("content")
	if !exists {
		return ""
	}
	return normalizeWhitespace(content)
}

func normalizeWhitespace(s string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(s)), " ")
}

func truncateDescription(s string) string {
	s = normalizeWhitespace(s)
	if utf8.RuneCountInString(s) <= maxDescriptionLen {
		return s
	}

	runes := []rune(s)
	return string(runes[:maxDescriptionLen-1]) + "…"
}
