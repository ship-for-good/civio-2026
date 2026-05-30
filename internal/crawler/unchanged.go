package crawler

import (
	"net/http"
	"time"

	"github.com/civio/civio-2026/internal/models"
	"github.com/civio/civio-2026/internal/sedefollow"
)

func HashBody(body []byte) string {
	return sedefollow.HashBody(body)
}

func ParseHTTPDate(value string) (time.Time, bool) {
	if value == "" {
		return time.Time{}, false
	}
	t, err := http.ParseTime(value)
	if err != nil {
		return time.Time{}, false
	}
	return t.UTC(), true
}

// IsUnchanged reports whether fetched content matches stored node fingerprints.
func IsUnchanged(existing *models.Node, etag string, lastModified time.Time, htmlHash string) bool {
	if existing == nil || existing.ScrapedAt.IsZero() {
		return false
	}

	if etag != "" && existing.HTTPEtag != "" && etag == existing.HTTPEtag {
		return true
	}

	if !lastModified.IsZero() && !existing.HTTPLastModified.IsZero() &&
		lastModified.UTC().Equal(existing.HTTPLastModified.UTC()) {
		return true
	}

	if htmlHash != "" && existing.HTMLHash != "" && htmlHash == existing.HTMLHash {
		return true
	}

	return false
}
