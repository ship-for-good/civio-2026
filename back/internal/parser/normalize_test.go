package parser

import (
	"os"
	"strings"
	"testing"
)

func TestExtractPageDescription(t *testing.T) {
	html, err := os.ReadFile("testdata/por-materias.html")
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}

	desc := ExtractPageDescription(html)
	if desc == "" {
		t.Fatal("expected non-empty description from meta or body")
	}
	if !strings.Contains(desc, "materias") && !strings.Contains(desc, "Materias") {
		t.Fatalf("unexpected description: %q", desc)
	}
}

func TestContextDescription(t *testing.T) {
	desc := ContextDescription("Retribuciones de altos cargos", "Organización y Empleo Público", "leaf_static")
	if desc == "" {
		t.Fatal("expected context description")
	}
	if !strings.Contains(desc, "Retribuciones") || !strings.Contains(desc, "Organización") {
		t.Fatalf("unexpected context description: %q", desc)
	}
}

func TestNormalizeURL(t *testing.T) {
	tests := []struct {
		in   string
		want string
		ok   bool
	}{
		{"/publicidad-activa/por-materias", BaseURL + "/publicidad-activa/por-materias", true},
		{"https://transparencia.gob.es/publicidad-activa/", BaseURL + "/publicidad-activa", true},
		{"https://example.com/foo", "https://example.com/foo", false},
		{"#anchor", "", false},
		{"/bin/customLogout.json?path=foo", "", false},
	}

	for _, tc := range tests {
		got, ok := NormalizeURL(tc.in)
		if ok != tc.ok || got != tc.want {
			t.Errorf("NormalizeURL(%q) = (%q, %v), want (%q, %v)", tc.in, got, ok, tc.want, tc.ok)
		}
	}
}

func TestExtractNavLinks(t *testing.T) {
	html, err := os.ReadFile("testdata/por-materias.html")
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}

	links := ExtractNavLinks(html)
	if len(links) < 50 {
		t.Fatalf("expected many nav links, got %d", len(links))
	}

	found := false
	for _, link := range links {
		if link.URL == BaseURL+"/publicidad-activa/por-materias/organizacion-empleo" {
			found = true
			break
		}
	}
	if !found {
		t.Fatal("expected organizacion-empleo link in navigation")
	}
}

func TestParentURL(t *testing.T) {
	child := BaseURL + "/publicidad-activa/por-materias/organizacion-empleo"
	parent, ok := ParentURL(child)
	if !ok {
		t.Fatal("expected parent")
	}
	want := BaseURL + "/publicidad-activa/por-materias"
	if parent != want {
		t.Fatalf("ParentURL = %q, want %q", parent, want)
	}
}

func TestDepthFromPath(t *testing.T) {
	url := BaseURL + "/publicidad-activa/por-materias/organizacion-empleo"
	if got := DepthFromPath(url); got != 3 {
		t.Fatalf("depth = %d, want 3", got)
	}
}
