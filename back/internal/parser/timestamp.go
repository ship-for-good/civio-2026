package parser

import (
	"bytes"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

var htmlUpdatedAtRe = regexp.MustCompile(`(?i)(?:última actualización|ultima actualizacion)\s*:\s*(\d{2}/\d{2}/\d{4})`)

// ExtractPageUpdatedAt parses editorial "Última actualización: DD/MM/YYYY" from page body.
// Not all pages include this block; empty time means unavailable in HTML.
func ExtractPageUpdatedAt(html []byte) (time.Time, bool) {
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(html))
	if err != nil {
		return time.Time{}, false
	}

	dateText := doc.Find("div.date").First().Text()
	if dateText == "" {
		return time.Time{}, false
	}

	match := htmlUpdatedAtRe.FindStringSubmatch(dateText)
	if len(match) < 2 {
		return time.Time{}, false
	}

	t, err := time.ParseInLocation("02/01/2006", match[1], time.UTC)
	if err != nil {
		return time.Time{}, false
	}
	return t, true
}

func FormatRFC3339(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

func ParseRFC3339(s string) (time.Time, bool) {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}, false
	}
	t, err := time.Parse(time.RFC3339, s)
	if err != nil {
		return time.Time{}, false
	}
	return t, true
}
