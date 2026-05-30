package parser

import (
	"bytes"

	"github.com/PuerkitoBio/goquery"
)

func ExtractPageTitleFromHTML(html []byte) string {
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(html))
	if err != nil {
		return ""
	}
	return ExtractPageTitle(doc)
}
