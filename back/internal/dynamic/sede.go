package dynamic

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/civio/civio-2026/internal/graph"
	"github.com/civio/civio-2026/internal/models"
	"github.com/civio/civio-2026/internal/parser"
	"github.com/civio/civio-2026/internal/sedefollow"
)

type playwrightSedeFetcher struct {
	scraper *Scraper
}

func (p *playwrightSedeFetcher) Fetch(ctx context.Context, url string) (*sedefollow.FetchResult, error) {
	html, err := p.scraper.FetchRenderedHTML(ctx, url)
	if err != nil {
		return nil, err
	}
	return &sedefollow.FetchResult{
		URL:       url,
		Body:      []byte(html),
		FetchedAt: time.Now().UTC(),
	}, nil
}

type sedePassResult struct {
	LeavesProcessed int
	ChainsExtended  int
	SedePages       int
	Errors          int
}

func runSedeFollowPass(ctx context.Context, store *graph.Store, scraper *Scraper, follower *sedefollow.Follower, handled *sync.Map) (*sedePassResult, error) {
	if follower == nil {
		follower = sedefollow.NewFollower(store, &playwrightSedeFetcher{scraper: scraper}, 10000)
	}
	result := &sedePassResult{}

	leaves, err := store.ListTransparenciaLeavesForSede()
	if err != nil {
		return nil, err
	}

	log.Printf("sede follow: checking %d transparencia leaf nodes", len(leaves))
	for _, node := range leaves {
		if ctx.Err() != nil {
			return result, ctx.Err()
		}
		if _, done := handled.Load(node.URL); done {
			continue
		}

		html, err := scraper.FetchRenderedHTML(ctx, node.URL)
		if err != nil {
			result.Errors++
			log.Printf("sede leaf fetch error %s: %v", node.URL, err)
			continue
		}

		result.LeavesProcessed++
		follower.FollowFromHTML(ctx, node.ID, node.Title, []byte(html), node.PageType)
	}

	incomplete, err := store.ListIncompleteSedeNodes()
	if err != nil {
		return nil, err
	}

	log.Printf("sede follow: extending %d incomplete sede navigation nodes", len(incomplete))
	for _, node := range incomplete {
		if ctx.Err() != nil {
			return result, ctx.Err()
		}

		html, err := scraper.FetchRenderedHTML(ctx, node.URL)
		if err != nil {
			result.Errors++
			log.Printf("sede extend fetch error %s: %v", node.URL, err)
			continue
		}

		if err := follower.ContinueFromNode(ctx, node.ID, node.URL, []byte(html)); err != nil {
			result.Errors++
			log.Printf("sede extend error %s: %v", node.URL, err)
			continue
		}
		result.ChainsExtended++
	}

	if err := graph.RefreshChildContents(store); err != nil {
		return result, err
	}

	result.SedePages = follower.PagesUsed()
	return result, nil
}

func shouldFollowSedeFromDynamic(node graph.DynamicNodeRow) bool {
	if parser.IsSedeURL(node.URL) {
		return node.PageType == models.PageTypeNavigation
	}
	return node.PageType == models.PageTypeLeafStatic || node.PageType == models.PageTypeLeafDynamic
}
