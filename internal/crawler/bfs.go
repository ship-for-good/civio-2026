package crawler

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/civio/civio-2026/internal/graph"
	"github.com/civio/civio-2026/internal/models"
	"github.com/civio/civio-2026/internal/parser"
)

type Config struct {
	SeedURL       string
	Workers       int
	RateLimit     float64
	MaxPages      int
	SkipUnchanged bool
}

type Crawler struct {
	fetcher *Fetcher
	store   *graph.Store
	cfg     Config
}

func New(store *graph.Store, cfg Config) *Crawler {
	if cfg.Workers <= 0 {
		cfg.Workers = 5
	}
	if cfg.RateLimit <= 0 {
		cfg.RateLimit = 3
	}
	if cfg.MaxPages <= 0 {
		cfg.MaxPages = 10000
	}

	return &Crawler{
		fetcher: NewFetcher(cfg.RateLimit),
		store:   store,
		cfg:     cfg,
	}
}

func RunBFS(ctx context.Context, store *graph.Store, cfg Config) error {
	c := New(store, cfg)

	normalizedSeed, ok := parser.NormalizeURL(cfg.SeedURL)
	if !ok {
		return fmt.Errorf("invalid seed URL: %s", cfg.SeedURL)
	}

	runID, err := store.StartCrawlRun()
	if err != nil {
		return err
	}

	var (
		mu      sync.Mutex
		visited = map[string]struct{}{normalizedSeed: {}}
		queue   = []string{normalizedSeed}
		errors  int
		skipped int
	)

	pagesProcessed := 0

	for len(queue) > 0 && pagesProcessed < cfg.MaxPages {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		url := queue[0]
		queue = queue[1:]

		result, err := c.fetcher.Fetch(ctx, url)
		if err != nil {
			mu.Lock()
			errors++
			mu.Unlock()
			log.Printf("fetch error %s: %v", url, err)
			pagesProcessed++
			continue
		}

		if result.Status != http.StatusOK {
			mu.Lock()
			errors++
			mu.Unlock()
			log.Printf("HTTP %d for %s", result.Status, url)
			pagesProcessed++
			continue
		}

		htmlHash := HashBody(result.Body)
		existing, _ := store.GetNodeByURL(url)

		if cfg.SkipUnchanged && IsUnchanged(existing, result.ETag, result.LastModified, htmlHash) {
			mu.Lock()
			skipped++
			mu.Unlock()
			newURLs := collectNavURLs(result.Body)
			mu.Lock()
			for _, u := range newURLs {
				if _, seen := visited[u]; seen {
					continue
				}
				if !parser.IsPublicidadActivaURL(u) {
					continue
				}
				visited[u] = struct{}{}
				queue = append(queue, u)
			}
			mu.Unlock()
			pagesProcessed++
			continue
		}

		newURLs, err := c.ingestPage(result, htmlHash)
		if err != nil {
			mu.Lock()
			errors++
			mu.Unlock()
			log.Printf("process error %s: %v", url, err)
		} else {
			mu.Lock()
			for _, u := range newURLs {
				if _, seen := visited[u]; seen {
					continue
				}
				if !parser.IsPublicidadActivaURL(u) {
					continue
				}
				visited[u] = struct{}{}
				queue = append(queue, u)
			}
			mu.Unlock()
		}

		pagesProcessed++
		if pagesProcessed%25 == 0 {
			log.Printf("progress: %d pages, %d queued, %d skipped, %d errors", pagesProcessed, len(queue), skipped, errors)
		}
	}

	log.Printf("crawl finished: %d pages, %d unique URLs, %d skipped (unchanged), %d errors", pagesProcessed, len(visited), skipped, errors)
	if err := graph.RefreshChildContents(store); err != nil {
		return fmt.Errorf("refresh child contents: %w", err)
	}
	return store.FinishCrawlRun(runID, len(visited), errors)
}

func collectNavURLs(html []byte) []string {
	links := parser.ExtractNavLinks(html)
	urls := make([]string, 0, len(links))
	for _, link := range links {
		urls = append(urls, link.URL)
	}
	return urls
}

func (c *Crawler) ingestPage(result *FetchResult, htmlHash string) ([]string, error) {
	pageURL := result.URL
	html := result.Body

	allLinks := parser.ExtractNavLinks(html)
	childLinks := parser.ExtractChildLinks(html, pageURL)

	title := parser.ExtractPageTitleFromHTML(html)
	if title == "" {
		for _, link := range allLinks {
			if link.URL == pageURL {
				title = link.Label
				break
			}
		}
	}

	pageType := ClassifyPage(html, pageURL, len(childLinks))

	var parentID *int64
	var parentTitle string
	if parentURL, ok := parser.ParentURL(pageURL); ok {
		if id, found, err := c.store.GetNodeIDByURL(parentURL); err == nil && found {
			parentID = &id
			if node, err := c.store.GetNodeByID(id); err == nil && node != nil {
				parentTitle = node.Title
			}
		}
	}

	description := parser.ExtractPageDescription(html)
	if description == "" {
		description = parser.ContextDescription(title, parentTitle, string(pageType))
	}

	contentUpdatedAt, _ := parser.ExtractPageUpdatedAt(html)

	nodeID, err := c.store.UpsertNode(graph.UpsertNodeInput{
		URL:              pageURL,
		Path:             parser.URLPath(pageURL),
		Title:            title,
		Description:      description,
		Depth:            parser.DepthFromPath(pageURL),
		PageType:         pageType,
		ParentID:         parentID,
		HTMLHash:         htmlHash,
		ContentUpdatedAt: contentUpdatedAt,
		HTTPLastModified: result.LastModified,
		HTTPEtag:         result.ETag,
		ScrapedAt:        result.FetchedAt,
	})
	if err != nil {
		return nil, err
	}

	var toVisit []string

	for _, child := range childLinks {
		childParentID := nodeID
		childID, err := c.store.UpsertNode(graph.UpsertNodeInput{
			URL:         child.URL,
			Path:        parser.URLPath(child.URL),
			Title:       child.Label,
			Description: parser.ContextDescription(child.Label, title, string(models.PageTypeNavigation)),
			Depth:       parser.DepthFromPath(child.URL),
			PageType:    models.PageTypeNavigation,
			ParentID:    &childParentID,
			ScrapedAt:   result.FetchedAt,
		})
		if err != nil {
			return nil, err
		}
		if err := c.store.UpsertEdge(nodeID, childID, child.Label); err != nil {
			return nil, err
		}
		toVisit = append(toVisit, child.URL)
	}

	for _, link := range allLinks {
		toVisit = append(toVisit, link.URL)
	}

	return toVisit, nil
}
