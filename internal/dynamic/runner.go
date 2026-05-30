package dynamic

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"time"

	"github.com/civio/civio-2026/internal/graph"
	"github.com/civio/civio-2026/internal/models"
)

type RunConfig struct {
	PageTypes     []string
	Limit         int
	SkipUnchanged bool
	Headless      bool
	TimeoutSec    int
}

type RunResult struct {
	Processed int
	Skipped   int
	Errors    int
}

func Run(ctx context.Context, store *graph.Store, cfg RunConfig) (*RunResult, error) {
	if len(cfg.PageTypes) == 0 {
		cfg.PageTypes = []string{string(models.PageTypeLeafDynamic)}
	}

	scraper, err := NewScraper(ScraperConfig{
		TimeoutSec: cfg.TimeoutSec,
		Headless:   cfg.Headless,
	})
	if err != nil {
		return nil, err
	}
	defer scraper.Close()

	nodes, err := store.ListNodesByPageTypes(cfg.PageTypes, cfg.Limit)
	if err != nil {
		return nil, err
	}

	log.Printf("scrape-dynamic: %d nodes to process (types: %v)", len(nodes), cfg.PageTypes)

	result := &RunResult{}
	for _, node := range nodes {
		select {
		case <-ctx.Done():
			return result, ctx.Err()
		default:
		}

		html, err := scraper.FetchRenderedHTML(ctx, node.URL)
		if err != nil {
			result.Errors++
			log.Printf("playwright error %s: %v", node.URL, err)
			continue
		}

		content := ExtractFromHTML(html, node.Title)
		content.ScrapedAt = time.Now().UTC().Format(time.RFC3339)

		hash := hashContent(content)
		if cfg.SkipUnchanged && node.DynamicHash != "" && node.DynamicHash == hash {
			result.Skipped++
			continue
		}

		if err := store.SaveDynamicContent(node.ID, content, hash); err != nil {
			result.Errors++
			log.Printf("save error %s: %v", node.URL, err)
			continue
		}

		result.Processed++
		log.Printf("scraped dynamic: %s (%d tables)", node.Title, len(content.Tables))
	}

	log.Printf("scrape-dynamic finished: %d processed, %d skipped, %d errors", result.Processed, result.Skipped, result.Errors)
	return result, nil
}

func hashContent(c *models.DynamicContent) string {
	data, _ := json.Marshal(c)
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}
