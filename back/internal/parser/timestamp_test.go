package parser

import (
	"os"
	"testing"
	"time"
)

func TestExtractPageUpdatedAt(t *testing.T) {
	html, err := os.ReadFile("testdata/por-materias.html")
	if err != nil {
		t.Fatalf("read fixture: %v", err)
	}

	updated, ok := ExtractPageUpdatedAt(html)
	if !ok {
		t.Fatal("expected updated date in por-materias fixture")
	}

	want := time.Date(2026, 1, 27, 0, 0, 0, 0, time.UTC)
	if !updated.Equal(want) {
		t.Fatalf("updated = %v, want %v", updated, want)
	}
}

func TestExtractPageUpdatedAtMissing(t *testing.T) {
	html := []byte(`<html><body><div class="date"></div></body></html>`)
	_, ok := ExtractPageUpdatedAt(html)
	if ok {
		t.Fatal("expected no date for empty block")
	}
}
