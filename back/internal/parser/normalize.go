package parser

import (
	"net/url"
	"strings"
)

const BaseURL = "https://transparencia.gob.es"

var skipPathPrefixes = []string{
	"/bin/",
	"/content/",
	"/libs/",
	"/etc/",
}

func NormalizeURL(raw string) (string, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" || strings.HasPrefix(raw, "#") || strings.HasPrefix(raw, "javascript:") {
		return "", false
	}

	parsed, err := url.Parse(raw)
	if err != nil {
		return "", false
	}

	if parsed.IsAbs() {
		if parsed.Host != "transparencia.gob.es" {
			return parsed.String(), false
		}
	} else {
		base, _ := url.Parse(BaseURL)
		parsed = base.ResolveReference(parsed)
	}

	path := parsed.Path
	if path == "" {
		path = "/"
	}
	path = strings.TrimSuffix(path, "/")
	if path == "" {
		path = "/"
	}

	for _, prefix := range skipPathPrefixes {
		if strings.HasPrefix(path, prefix) {
			return "", false
		}
	}

	if strings.Contains(path, "/_jcr_content/") {
		return "", false
	}

	normalized := BaseURL + path
	return normalized, true
}

func URLPath(normalized string) string {
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

func IsPublicidadActivaURL(normalized string) bool {
	path := URLPath(normalized)
	return path == "/publicidad-activa" || strings.HasPrefix(path, "/publicidad-activa/")
}

func IsExternalURL(normalized string) bool {
	parsed, err := url.Parse(normalized)
	if err != nil {
		return true
	}
	return parsed.Host != "" && parsed.Host != "transparencia.gob.es"
}

func ParentURL(normalized string) (string, bool) {
	path := URLPath(normalized)
	if path == "/publicidad-activa" {
		return "", false
	}

	idx := strings.LastIndex(path, "/")
	if idx <= 0 {
		return "", false
	}

	parentPath := path[:idx]
	if parentPath == "" {
		parentPath = "/"
	}
	return BaseURL + parentPath, true
}

func DepthFromPath(normalized string) int {
	path := URLPath(normalized)
	if path == "/" {
		return 0
	}
	segments := strings.Split(strings.Trim(path, "/"), "/")
	return len(segments)
}

func CleanLabel(label string) string {
	label = strings.TrimSpace(label)
	label = strings.Join(strings.Fields(label), " ")
	label = strings.TrimPrefix(label, "Portada de ")
	return label
}
