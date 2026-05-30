package crawler

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"golang.org/x/time/rate"
)

const defaultUserAgent = "CivioHackathon/1.0 (+https://civio.es)"

type Fetcher struct {
	client  *http.Client
	limiter *rate.Limiter
}

type FetchResult struct {
	URL          string
	Body         []byte
	Status       int
	ETag         string
	LastModified time.Time
	FetchedAt    time.Time
}

func NewFetcher(requestsPerSecond float64) *Fetcher {
	if requestsPerSecond <= 0 {
		requestsPerSecond = 3
	}
	return &Fetcher{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
		limiter: rate.NewLimiter(rate.Limit(requestsPerSecond), 1),
	}
}

func (f *Fetcher) Fetch(ctx context.Context, url string) (*FetchResult, error) {
	const maxRetries = 3
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		if err := f.limiter.Wait(ctx); err != nil {
			return nil, err
		}

		req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("User-Agent", defaultUserAgent)
		req.Header.Set("Accept", "text/html,application/xhtml+xml")

		resp, err := f.client.Do(req)
		if err != nil {
			lastErr = err
			time.Sleep(time.Duration(attempt+1) * time.Second)
			continue
		}

		body, readErr := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
		resp.Body.Close()

		if readErr != nil {
			lastErr = readErr
			continue
		}

		if resp.StatusCode == http.StatusTooManyRequests || resp.StatusCode >= 500 {
			lastErr = fmt.Errorf("HTTP %d for %s", resp.StatusCode, url)
			time.Sleep(time.Duration(attempt+1) * 2 * time.Second)
			continue
		}

		lastModified, _ := ParseHTTPDate(resp.Header.Get("Last-Modified"))

		return &FetchResult{
			URL:          url,
			Body:         body,
			Status:       resp.StatusCode,
			ETag:         resp.Header.Get("ETag"),
			LastModified: lastModified,
			FetchedAt:    time.Now().UTC(),
		}, nil
	}

	return nil, lastErr
}
