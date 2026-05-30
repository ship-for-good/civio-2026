package parser

import (
	"bytes"
	"net/url"
	"regexp"
	"sort"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/civio/civio-2026/internal/models"
)

const SedeBaseURL = "https://transparencia.sede.gob.es"

var skipSedePathPrefixes = []string{
	"/claveproxy/",
	"/.resources/",
	"/.rest/",
}

var (
	sedeLocationPattern = regexp.MustCompile(`(?i)window\.location\.(?:href|assign)\s*=\s*["']([^"']+)["']`)
	sedeQuotedPathPattern = regexp.MustCompile(`["'](/(?:procedimientos?|servicio|categoria|mis-expedientes|tramitar|solicitud|formulario)[^"'\\s]*)["']`)
	sedeGenericQuotedPathPattern = regexp.MustCompile(`["'](/[A-Za-z][A-Za-z0-9_\-./?=&%]*?)["']`)
	sedeEmbeddedPathPattern = regexp.MustCompile(`(?i)(/procedimiento/(?:formulario|tramitar|solicitud)[^"'\\s<>]*)`)
	sedeReturnURLPattern = regexp.MustCompile(`(?i)returnUrl=(https?%3A%2F%2Ftransparencia\.sede\.gob\.es[^&"'\\s]+)`)
)

func NormalizeSedeURL(raw string) (string, bool) {
	return NormalizeSedeURLWithBase(raw, SedeBaseURL)
}

func NormalizeSedeURLWithBase(raw, base string) (string, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" || strings.HasPrefix(raw, "#") || strings.HasPrefix(raw, "javascript:") {
		return "", false
	}

	parsed, err := url.Parse(raw)
	if err != nil {
		return "", false
	}

	if !parsed.IsAbs() {
		baseParsed, err := url.Parse(base)
		if err != nil {
			return "", false
		}
		parsed = baseParsed.ResolveReference(parsed)
	}

	if parsed.Host != "transparencia.sede.gob.es" {
		return "", false
	}

	parsed.Fragment = ""
	parsed.Host = "transparencia.sede.gob.es"
	parsed.Scheme = "https"

	path := parsed.Path
	if path == "" {
		path = "/"
	}
	path = strings.TrimSuffix(path, "/")
	if path == "" {
		path = "/"
	}

	for _, prefix := range skipSedePathPrefixes {
		if strings.HasPrefix(path, prefix) {
			return "", false
		}
	}

	normalized := SedeBaseURL
	if path != "/" {
		normalized += path
	}
	if parsed.RawQuery != "" {
		normalized += "?" + parsed.RawQuery
	}
	return normalized, true
}

func IsSedeURL(normalized string) bool {
	parsed, err := url.Parse(normalized)
	if err != nil {
		return false
	}
	return parsed.Host == "transparencia.sede.gob.es"
}

func IsSedeFormURL(normalized string) bool {
	lower := strings.ToLower(normalized)
	return strings.Contains(lower, "tramitar") ||
		strings.Contains(lower, "solicitud") ||
		strings.Contains(lower, "formulario")
}

func SedeURLPath(normalized string) string {
	parsed, err := url.Parse(normalized)
	if err != nil {
		return normalized
	}
	path := strings.TrimSuffix(parsed.Path, "/")
	if path == "" {
		return "/"
	}
	return path
}

func SedeDepthFromPath(normalized string) int {
	path := SedeURLPath(normalized)
	if path == "/" {
		return 1
	}
	return len(strings.Split(strings.Trim(path, "/"), "/")) + 1
}

// ExtractSedeLinks finds outbound links to transparencia.sede.gob.es, excluding the AEM sidebar.
func ExtractSedeLinks(html []byte) []models.NavLink {
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(html))
	if err != nil {
		return nil
	}

	seen := make(map[string]struct{})
	var links []models.NavLink

	doc.Find("a[href]").Each(func(_ int, sel *goquery.Selection) {
		if sel.Closest("nav.cmp-navigation").Length() > 0 {
			return
		}

		href, _ := sel.Attr("href")
		if !strings.Contains(strings.ToLower(href), "transparencia.sede.gob.es") {
			return
		}

		normalized, ok := NormalizeSedeURL(href)
		if !ok {
			return
		}
		if _, exists := seen[normalized]; exists {
			return
		}
		seen[normalized] = struct{}{}

		label := CleanLabel(sel.AttrOr("aria-label", sel.Text()))
		if label == "" {
			label = "Sede electrónica"
		}
		links = append(links, models.NavLink{
			URL:   normalized,
			Label: label,
		})
	})

	return links
}

// ExtractSedePageLinks returns same-domain links discovered on a sede page.
func ExtractSedePageLinks(html []byte, pageURL string) []models.NavLink {
	seen := make(map[string]struct{})
	var links []models.NavLink

	addLink := func(rawPath, label string) {
		normalized, ok := NormalizeSedeURLWithBase(rawPath, pageURL)
		if !ok {
			if absolute, absOK := NormalizeSedeURL(rawPath); absOK {
				normalized = absolute
			} else {
				return
			}
		}
		if normalized == pageURL || isSedeChromeURL(normalized) {
			return
		}
		if _, exists := seen[normalized]; exists {
			return
		}
		seen[normalized] = struct{}{}
		if label == "" {
			label = normalized
		}
		links = append(links, models.NavLink{
			URL:   normalized,
			Label: CleanLabel(label),
		})
	}

	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(html))
	if err == nil {
		doc.Find("a[href]").Each(func(_ int, sel *goquery.Selection) {
			href, _ := sel.Attr("href")
			label := CleanLabel(sel.AttrOr("aria-label", sel.Text()))
			addLink(href, label)
		})
	}

	raw := string(html)
	for _, match := range sedeLocationPattern.FindAllStringSubmatch(raw, -1) {
		addLink(match[1], match[1])
	}
	for _, match := range sedeQuotedPathPattern.FindAllStringSubmatch(raw, -1) {
		addLink(match[1], match[1])
	}
	for _, match := range sedeGenericQuotedPathPattern.FindAllStringSubmatch(raw, -1) {
		if !isLikelySedeRoute(match[1]) {
			continue
		}
		addLink(match[1], match[1])
	}
	for _, match := range sedeEmbeddedPathPattern.FindAllStringSubmatch(raw, -1) {
		addLink(match[1], match[1])
	}
	for _, match := range sedeReturnURLPattern.FindAllStringSubmatch(raw, -1) {
		decoded, err := url.QueryUnescape(match[1])
		if err != nil {
			continue
		}
		addLink(decoded, decoded)
	}

	return prioritizeSedeLinks(links)
}

func isLikelySedeRoute(path string) bool {
	if !strings.HasPrefix(path, "/") || strings.HasPrefix(path, "//") {
		return false
	}
	for _, prefix := range skipSedePathPrefixes {
		if strings.HasPrefix(path, prefix) {
			return false
		}
	}
	lower := strings.ToLower(path)
	for _, suffix := range []string{".js", ".css", ".ico", ".svg", ".png", ".jpg", ".woff", ".html"} {
		if strings.HasSuffix(lower, suffix) {
			return false
		}
	}
	if strings.Contains(lower, "/error/") || strings.Contains(lower, "/dam/") {
		return false
	}
	if strings.HasPrefix(lower, "/ca/") || strings.HasPrefix(lower, "/eu/") ||
		strings.HasPrefix(lower, "/gl/") || strings.HasPrefix(lower, "/va/") {
		return false
	}
	return true
}

func isSedeChromeURL(normalized string) bool {
	lower := strings.ToLower(normalized)
	chrome := []string{
		"/accesibilidad", "/aviso-legal", "/cookies", "/contacto", "/faqs", "/sitemap",
		"/normativa-sede", "/proteccion-datos", "/que-es-la-sede", "/requisitos",
		"/calendario-sede", "/fecha-sede", "/error/",
	}
	for _, fragment := range chrome {
		if strings.Contains(lower, fragment) {
			return true
		}
	}
	if strings.Contains(lower, "/servicio?id=") && !IsSedeFormURL(normalized) {
		return true
	}
	return false
}

func prioritizeSedeLinks(links []models.NavLink) []models.NavLink {
	if len(links) == 0 {
		return links
	}

	var forms, portadas, procedures, rest []models.NavLink
	for _, link := range links {
		lower := strings.ToLower(link.URL)
		switch {
		case IsSedeFormURL(link.URL):
			forms = append(forms, link)
		case strings.Contains(lower, "/procedimiento/portada"):
			portadas = append(portadas, link)
		case strings.Contains(lower, "procedimiento"):
			procedures = append(procedures, link)
		default:
			rest = append(rest, link)
		}
	}

	if len(forms) > 0 {
		return forms[:1]
	}

	if len(portadas) > 1 {
		sort.Slice(portadas, func(i, j int) bool {
			return portadas[i].URL > portadas[j].URL
		})
		filtered := portadas[:0]
		for _, link := range portadas {
			if strings.Contains(link.URL, "idAmb=100206") {
				continue
			}
			filtered = append(filtered, link)
		}
		if len(filtered) > 0 {
			portadas = filtered
		}
	}
	if len(portadas) > 0 {
		return portadas[:1]
	}
	if len(procedures) > 0 {
		return procedures[:1]
	}
	if len(rest) > 0 {
		return rest[:1]
	}
	return nil
}
