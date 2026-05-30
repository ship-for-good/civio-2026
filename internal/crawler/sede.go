package crawler

import (
	"context"
	"fmt"
	"net/http"

	"github.com/civio/civio-2026/internal/models"
	"github.com/civio/civio-2026/internal/sedefollow"
)

type httpSedeFetcher struct {
	fetcher *Fetcher
}

func (h *httpSedeFetcher) Fetch(ctx context.Context, url string) (*sedefollow.FetchResult, error) {
	result, err := h.fetcher.Fetch(ctx, url)
	if err != nil {
		return nil, err
	}
	if result.Status != http.StatusOK {
		return nil, fmt.Errorf("HTTP %d for %s", result.Status, url)
	}
	return &sedefollow.FetchResult{
		URL:       result.URL,
		Body:      result.Body,
		FetchedAt: result.FetchedAt,
	}, nil
}

func (c *Crawler) followSedeLinks(ctx context.Context, linkerID int64, linkerTitle string, html []byte, pageType models.PageType) {
	c.sedeFollower.FollowFromHTML(ctx, linkerID, linkerTitle, html, pageType)
}
