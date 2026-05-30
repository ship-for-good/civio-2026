package crawler

import (
	"testing"

	"github.com/civio/civio-2026/internal/models"
	"github.com/civio/civio-2026/internal/parser"
)

func TestClassifySedePage(t *testing.T) {
	html := []byte(`<html><body><main><p>Formulario de solicitud</p></main></body></html>`)
	pageType := ClassifyPage(html, parser.SedeBaseURL+"/procedimientos/acceso/tramitar", 0)
	if pageType != models.PageTypeLeafStatic {
		t.Fatalf("expected leaf_static for sede page, got %s", pageType)
	}
}
