package dynamic

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"sync"
	"sync/atomic"
	"time"

	"github.com/civio/civio-2026/internal/graph"
	"github.com/civio/civio-2026/internal/models"
	"github.com/civio/civio-2026/internal/parser"
	"github.com/civio/civio-2026/internal/sedefollow"
)

type RunConfig struct {
	PageTypes     []string
	Limit         int
	Workers       int
	SkipUnchanged bool
	Headless      bool
	TimeoutSec    int
	FollowSede    bool
	MaxSedePages  int
}

type RunResult struct {
	Processed       int
	Skipped         int
	Errors          int
	SedeLeaves      int
	SedeExtended    int
	SedePages       int
	SedeErrors      int
}

func normalizeWorkers(workers int) int {
	if workers <= 0 {
		return 5
	}
	if workers > 10 {
		return 10
	}
	return workers
}

func Run(ctx context.Context, store *graph.Store, cfg RunConfig) (*RunResult, error) {
	if len(cfg.PageTypes) == 0 {
		cfg.PageTypes = []string{string(models.PageTypeLeafDynamic)}
	}
	cfg.Workers = normalizeWorkers(cfg.Workers)

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

	log.Printf("scrape-dynamic: %d nodes, %d workers (types: %v, follow-sede: %v)", len(nodes), cfg.Workers, cfg.PageTypes, cfg.FollowSede)

	if len(nodes) == 0 && !cfg.FollowSede {
		return &RunResult{}, nil
	}

	jobs := make(chan graph.DynamicNodeRow, len(nodes))
	for _, node := range nodes {
		jobs <- node
	}
	close(jobs)

	var processed, skipped, errors atomic.Int32
	var sedeHandled sync.Map
	start := time.Now()

	var follower *sedefollow.Follower
	if cfg.FollowSede {
		maxSede := cfg.MaxSedePages
		if maxSede <= 0 {
			maxSede = 10000
		}
		follower = sedefollow.NewFollower(store, &playwrightSedeFetcher{scraper: scraper}, maxSede)
	}

	var wg sync.WaitGroup
	for i := 0; i < cfg.Workers; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for node := range jobs {
				if ctx.Err() != nil {
					return
				}
				scrapeNode(ctx, scraper, store, cfg, follower, &sedeHandled, node, &processed, &skipped, &errors)
			}
		}(i)
	}

	wg.Wait()

	result := &RunResult{
		Processed: int(processed.Load()),
		Skipped:   int(skipped.Load()),
		Errors:    int(errors.Load()),
	}

	if cfg.FollowSede {
		sedeResult, err := runSedeFollowPass(ctx, store, scraper, follower, &sedeHandled)
		if err != nil && ctx.Err() == nil {
			return result, err
		}
		if sedeResult != nil {
			result.SedeLeaves = sedeResult.LeavesProcessed
			result.SedeExtended = sedeResult.ChainsExtended
			result.SedePages = sedeResult.SedePages
			result.SedeErrors = sedeResult.Errors
		}
	}

	elapsed := time.Since(start)

	log.Printf("scrape-dynamic finished: %d processed, %d skipped, %d errors in %s (%.1fs/page avg)",
		result.Processed, result.Skipped, result.Errors,
		elapsed.Round(time.Second),
		avgSecondsPerPage(elapsed, len(nodes)))
	if cfg.FollowSede {
		log.Printf("sede follow: %d leaves, %d extended, %d sede pages fetched, %d errors",
			result.SedeLeaves, result.SedeExtended, result.SedePages, result.SedeErrors)
	}

	if ctx.Err() != nil {
		return result, ctx.Err()
	}
	return result, nil
}

func scrapeNode(
	ctx context.Context,
	scraper *Scraper,
	store *graph.Store,
	cfg RunConfig,
	follower *sedefollow.Follower,
	sedeHandled *sync.Map,
	node graph.DynamicNodeRow,
	processed, skipped, errors *atomic.Int32,
) {
	html, err := scraper.FetchRenderedHTML(ctx, node.URL)
	if err != nil {
		errors.Add(1)
		log.Printf("playwright error %s: %v", node.URL, err)
		return
	}

	content := ExtractFromHTML(html, node.Title)
	content.ScrapedAt = time.Now().UTC().Format(time.RFC3339)

	hash := hashContent(content)
	if cfg.SkipUnchanged && node.DynamicHash != "" && node.DynamicHash == hash {
		skipped.Add(1)
	} else if err := store.SaveDynamicContent(node.ID, content, hash); err != nil {
		errors.Add(1)
		log.Printf("save error %s: %v", node.URL, err)
		return
	} else {
		processed.Add(1)
		log.Printf("scraped dynamic: %s (%d tables)", node.Title, len(content.Tables))
	}

	if cfg.FollowSede && follower != nil && shouldFollowSedeFromDynamic(node) {
		sedeHandled.Store(node.URL, struct{}{})
		if parser.IsSedeURL(node.URL) {
			if err := follower.ContinueFromNode(ctx, node.ID, node.URL, []byte(html)); err != nil {
				log.Printf("sede continue error %s: %v", node.URL, err)
			}
		} else {
			follower.FollowFromHTML(ctx, node.ID, node.Title, []byte(html), node.PageType)
		}
	}
}

func avgSecondsPerPage(elapsed time.Duration, total int) float64 {
	if total == 0 {
		return 0
	}
	return elapsed.Seconds() / float64(total)
}

func hashContent(c *models.DynamicContent) string {
	data, _ := json.Marshal(c)
	sum := sha256.Sum256(data)
	return hex.EncodeToString(sum[:])
}
