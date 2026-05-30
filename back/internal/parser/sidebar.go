package parser

import (
	"bytes"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/civio/civio-2026/internal/models"
)

func ExtractPageTitle(doc *goquery.Document) string {
	if title := doc.Find("h1").First().Text(); title != "" {
		return CleanLabel(title)
	}
	if title := doc.Find("title").First().Text(); title != "" {
		parts := strings.Split(title, "|")
		if len(parts) > 0 {
			return CleanLabel(parts[0])
		}
	}
	return ""
}

func ExtractNavLinks(html []byte) []models.NavLink {
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(html))
	if err != nil {
		return nil
	}

	seen := make(map[string]struct{})
	var links []models.NavLink

	addLink := func(href, label string) {
		normalized, ok := NormalizeURL(href)
		if !ok || !IsPublicidadActivaURL(normalized) {
			return
		}
		if _, exists := seen[normalized]; exists {
			return
		}
		seen[normalized] = struct{}{}
		links = append(links, models.NavLink{
			URL:   normalized,
			Label: CleanLabel(label),
		})
	}

	doc.Find("nav.cmp-navigation a.cmp-navigation__item-link[href]").Each(func(_ int, sel *goquery.Selection) {
		href, _ := sel.Attr("href")
		addLink(href, sel.Text())
	})

	doc.Find("a.cmp-title__link[href]").Each(func(_ int, sel *goquery.Selection) {
		href, _ := sel.Attr("href")
		label, _ := sel.Attr("title")
		if label == "" {
			label = sel.Text()
		}
		addLink(href, label)
	})

	doc.Find("article.dnt-card a[href]").Each(func(_ int, sel *goquery.Selection) {
		href, _ := sel.Attr("href")
		label, _ := sel.Attr("aria-label")
		if label == "" {
			label = sel.Text()
		}
		addLink(href, label)
	})

	return links
}

func ExtractChildLinks(html []byte, pageURL string) []models.NavLink {
	all := ExtractNavLinks(html)
	var children []models.NavLink

	for _, link := range all {
		parent, ok := ParentURL(link.URL)
		if ok && parent == pageURL {
			children = append(children, link)
		}
	}

	if len(children) > 0 {
		return children
	}

	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(html))
	if err != nil {
		return nil
	}

	seen := make(map[string]struct{})
	doc.Find(".dnt-card-container a.cmp-title__link[href], .card-container a.cmp-title__link[href]").Each(func(_ int, sel *goquery.Selection) {
		href, _ := sel.Attr("href")
		normalized, ok := NormalizeURL(href)
		if !ok || !IsPublicidadActivaURL(normalized) {
			return
		}
		if _, exists := seen[normalized]; exists {
			return
		}
		seen[normalized] = struct{}{}
		label, _ := sel.Attr("title")
		if label == "" {
			label = sel.Text()
		}
		children = append(children, models.NavLink{
			URL:   normalized,
			Label: CleanLabel(label),
		})
	})

	return children
}
