package crawler

import (
	"context"
	"log"
	"net/http"

	"github.com/civio/civio-2026/internal/graph"
	"github.com/civio/civio-2026/internal/models"
	"github.com/civio/civio-2026/internal/parser"
)

const maxSedeDepth = 15

type sedeChainResult struct {
	firstNodeID    int64
	terminalNodeID int64
}

type sedeQueueItem struct {
	url    string
	fromID int64
	label  string
	depth  int
}

func (c *Crawler) followSedeLinks(ctx context.Context, linkerID int64, linkerTitle string, html []byte, pageType models.PageType) {
	if pageType != models.PageTypeLeafStatic && pageType != models.PageTypeLeafDynamic {
		return
	}

	links := parser.ExtractSedeLinks(html)
	if len(links) == 0 {
		return
	}

	seen := make(map[string]struct{}, len(links))
	for _, link := range links {
		if _, dup := seen[link.URL]; dup {
			continue
		}
		seen[link.URL] = struct{}{}

		if err := c.followSedeChain(ctx, linkerID, linkerTitle, link); err != nil {
			log.Printf("sede chain from node %d (%s): %v", linkerID, link.URL, err)
		}
	}
}

func (c *Crawler) followSedeChain(ctx context.Context, linkerID int64, linkerTitle string, startLink models.NavLink) error {
	startURL, ok := parser.NormalizeSedeURL(startLink.URL)
	if !ok {
		return nil
	}

	c.sedeMu.Lock()
	if cached, exists := c.sedeResolved[startURL]; exists {
		c.sedeMu.Unlock()
		if cached.firstNodeID == 0 {
			return nil
		}
		return c.store.UpsertEdge(linkerID, cached.firstNodeID, startLink.Label)
	}
	c.sedeMu.Unlock()

	type queueItem = sedeQueueItem

	var (
		queue          = []queueItem{{url: startURL, fromID: linkerID, label: startLink.Label, depth: 0}}
		sedeSeen       = map[string]struct{}{startURL: {}}
		firstNodeID    int64
		terminalNodeID int64
	)

	for len(queue) > 0 {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		if c.sedePages >= c.cfg.MaxPages {
			break
		}

		item := queue[0]
		queue = queue[1:]

		if item.depth > maxSedeDepth {
			continue
		}

		result, err := c.fetcher.Fetch(ctx, item.url)
		c.sedePages++
		if err != nil {
			log.Printf("sede fetch error %s: %v", item.url, err)
			continue
		}
		if result.Status != http.StatusOK {
			log.Printf("sede HTTP %d for %s", result.Status, item.url)
			continue
		}

		childLinks := parser.ExtractSedePageLinks(result.Body, item.url)
		title := parser.ExtractPageTitleFromHTML(result.Body)
		if title == "" {
			title = startLink.Label
		}
		if title == "" {
			title = item.label
		}

		isForm := parser.IsSedeFormURL(item.url)
		isTerminal := isForm || len(childLinks) == 0

		pageType := models.PageTypeNavigation
		if isTerminal {
			pageType = models.PageTypeLeafStatic
		}

		var parentID *int64
		if isTerminal {
			parentID = &linkerID
		} else {
			parentID = &item.fromID
		}

		description := parser.ExtractPageDescription(result.Body)
		if description == "" {
			description = parser.ContextDescription(title, linkerTitle, string(pageType))
		}

		nodeID, err := c.store.UpsertNode(graph.UpsertNodeInput{
			URL:         item.url,
			Path:        parser.SedeURLPath(item.url),
			Title:       title,
			Description: description,
			Depth:       parser.SedeDepthFromPath(item.url),
			PageType:    pageType,
			ParentID:    parentID,
			HTMLHash:    HashBody(result.Body),
			ScrapedAt:   result.FetchedAt,
		})
		if err != nil {
			return err
		}

		if firstNodeID == 0 {
			firstNodeID = nodeID
		}

		if err := c.store.UpsertEdge(item.fromID, nodeID, item.label); err != nil {
			return err
		}

		if isTerminal {
			terminalNodeID = nodeID
			break
		}

		if len(childLinks) == 0 {
			continue
		}

		child := childLinks[0]
		if _, seen := sedeSeen[child.URL]; seen {
			continue
		}
		sedeSeen[child.URL] = struct{}{}
		queue = append([]queueItem{{
			url:    child.URL,
			fromID: nodeID,
			label:  child.Label,
			depth:  item.depth + 1,
		}}, queue...)
	}

	c.sedeMu.Lock()
	c.sedeResolved[startURL] = sedeChainResult{
		firstNodeID:    firstNodeID,
		terminalNodeID: terminalNodeID,
	}
	c.sedeMu.Unlock()

	return nil
}
