package dynamic

import (
	"os"
	"testing"
)

func TestExtractFromHTMLTables(t *testing.T) {
	html := `<html><body><main>
		<div class="table-dintel">
		<table><thead><tr><th>A</th><th>B</th></tr></thead>
		<tbody><tr><td>1</td><td>2</td></tr></tbody></table>
		</div>
		<p>Texto de prueba dinámico</p>
	</main></body></html>`

	content := ExtractFromHTML(html, "Test")
	if len(content.Tables) != 1 {
		t.Fatalf("tables = %d, want 1", len(content.Tables))
	}
	if len(content.Tables[0].Headers) != 2 {
		t.Fatalf("headers = %v", content.Tables[0].Headers)
	}
	if !contains(content.Text, "Texto de prueba") {
		t.Fatalf("text = %q", content.Text)
	}
}

func TestExtractFromHTMLFixture(t *testing.T) {
	html, err := os.ReadFile("../parser/testdata/por-materias.html")
	if err != nil {
		t.Skip("fixture not available")
	}
	content := ExtractFromHTML(string(html), "Materias")
	if content.Text == "" {
		t.Fatal("expected text from static fixture")
	}
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(sub) == 0 ||
		(len(s) > 0 && stringIndex(s, sub) >= 0))
}

func stringIndex(s, sub string) int {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return i
		}
	}
	return -1
}
