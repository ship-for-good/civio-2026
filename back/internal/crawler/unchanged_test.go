package crawler

import (
	"testing"
	"time"

	"github.com/civio/civio-2026/internal/models"
)

func TestIsUnchanged(t *testing.T) {
	existing := &models.Node{
		HTTPEtag:         `"abc"`,
		HTTPLastModified: time.Date(2026, 5, 30, 3, 37, 5, 0, time.UTC),
		HTMLHash:         "deadbeef",
		ScrapedAt:        time.Now(),
	}

	if !IsUnchanged(existing, `"abc"`, time.Time{}, "") {
		t.Fatal("expected unchanged by etag")
	}
	if !IsUnchanged(existing, "", existing.HTTPLastModified, "") {
		t.Fatal("expected unchanged by last-modified")
	}
	if !IsUnchanged(existing, "", time.Time{}, "deadbeef") {
		t.Fatal("expected unchanged by hash")
	}
	if IsUnchanged(existing, `"other"`, time.Time{}, "other") {
		t.Fatal("expected changed")
	}
	if IsUnchanged(nil, `"abc"`, time.Time{}, "deadbeef") {
		t.Fatal("expected changed when no existing node")
	}
}
