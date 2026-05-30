package parser

import (
	"os"
	"strings"
	"testing"
)

func TestNormalizeSedeURL(t *testing.T) {
	tests := []struct {
		in   string
		want string
		ok   bool
	}{
		{"https://transparencia.sede.gob.es", SedeBaseURL, true},
		{"https://transparencia.sede.gob.es/", SedeBaseURL, true},
		{"/procedimientos?search=", SedeBaseURL + "/procedimientos?search=", true},
		{"https://transparencia.sede.gob.es/procedimientos/foo/tramitar", SedeBaseURL + "/procedimientos/foo/tramitar", true},
		{"/claveproxy/clave/authenticate", "", false},
		{"https://example.com/formulario", "", false},
	}

	for _, tc := range tests {
		got, ok := NormalizeSedeURLWithBase(tc.in, SedeBaseURL)
		if ok != tc.ok || got != tc.want {
			t.Errorf("NormalizeSedeURLWithBase(%q) = (%q, %v), want (%q, %v)", tc.in, got, ok, tc.want, tc.ok)
		}
	}
}

func TestIsSedeFormURL(t *testing.T) {
	if !IsSedeFormURL(SedeBaseURL + "/procedimientos/acceso/tramitar") {
		t.Fatal("expected tramitar URL to be a form URL")
	}
	if !IsSedeFormURL(SedeBaseURL + "/solicitud-informacion") {
		t.Fatal("expected solicitud URL to be a form URL")
	}
	if IsSedeFormURL(SedeBaseURL + "/procedimientos?search=") {
		t.Fatal("did not expect procedimientos search to be a form URL")
	}
}

func TestExtractSedeLinks(t *testing.T) {
	html, err := os.ReadFile("testdata/por-materias.html")
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}

	links := ExtractSedeLinks(html)
	if len(links) == 0 {
		t.Fatal("expected sede link in fixture")
	}
	if links[0].URL != SedeBaseURL {
		t.Fatalf("unexpected sede URL: %q", links[0].URL)
	}
}

func TestExtractSedePageLinks(t *testing.T) {
	html := []byte(`
<html><body>
  <a href="/procedimientos?search=">Procedimientos</a>
  <a href="/procedimientos/acceso/tramitar">Tramitar acceso</a>
  <a href="/claveproxy/clave/authenticate">Login</a>
  <a href="https://example.com/other">External</a>
  <script>window.location.href="/procedimientos?search="</script>
</body></html>`)

	links := ExtractSedePageLinks(html, SedeBaseURL)
	if len(links) != 1 {
		t.Fatalf("expected 1 prioritized sede link, got %d: %+v", len(links), links)
	}
	if !strings.Contains(links[0].URL, "tramitar") {
		t.Fatalf("expected tramitar link first, got %q", links[0].URL)
	}
}
