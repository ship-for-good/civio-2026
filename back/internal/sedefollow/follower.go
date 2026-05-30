package sedefollow

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/civio/civio-2026/internal/graph"
	"github.com/civio/civio-2026/internal/models"
	"github.com/civio/civio-2026/internal/parser"
)

const MaxDepth = 15

type FetchResult struct {
	URL       string
	Body      []byte
	FetchedAt time.Time
}

type Fetcher interface {
	Fetch(ctx context.Context, url string) (*FetchResult, error)
}

type chainResult struct {
	firstNodeID    int64
	terminalNodeID int64
}

type queueItem struct {
	url    string
	fromID int64
	label  string
	depth  int
}

type Follower struct {
	store    *graph.Store
	fetch    Fetcher
	maxPages int

	mu       sync.Mutex
	resolved map[string]chainResult
	pages    int
}

func NewFollower(store *graph.Store, fetch Fetcher, maxPages int) *Follower {
	if maxPages <= 0 {
		maxPages = 10000
	}
	return &Follower{
		store:    store,
		fetch:    fetch,
		maxPages: maxPages,
		resolved: make(map[string]chainResult),
	}
}

func (f *Follower) PagesUsed() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return f.pages
}

func (f *Follower) FollowFromHTML(ctx context.Context, linkerID int64, linkerTitle string, html []byte, pageType models.PageType) {
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
		if err := f.FollowChain(ctx, linkerID, linkerTitle, link); err != nil {
			log.Printf("sede chain from node %d (%s): %v", linkerID, link.URL, err)
		}
	}
}

func (f *Follower) FollowChain(ctx context.Context, linkerID int64, linkerTitle string, startLink models.NavLink) error {
	startURL, ok := parser.NormalizeSedeURL(startLink.URL)
	if !ok {
		return nil
	}

	f.mu.Lock()
	if cached, exists := f.resolved[startURL]; exists {
		f.mu.Unlock()
		if cached.firstNodeID == 0 {
			return nil
		}
		return f.store.UpsertEdge(linkerID, cached.firstNodeID, startLink.Label)
	}
	f.mu.Unlock()

	queue := []queueItem{{url: startURL, fromID: linkerID, label: startLink.Label, depth: 0}}
	sedeSeen := map[string]struct{}{startURL: {}}

	firstNodeID, terminalNodeID, err := f.walkQueue(ctx, linkerID, linkerTitle, startLink.Label, queue, sedeSeen)
	if err != nil {
		return err
	}

	f.mu.Lock()
	f.resolved[startURL] = chainResult{firstNodeID: firstNodeID, terminalNodeID: terminalNodeID}
	f.mu.Unlock()
	return nil
}

// ContinueFromNode extends an existing sede chain using rendered HTML from a navigation node.
func (f *Follower) ContinueFromNode(ctx context.Context, fromNodeID int64, pageURL string, html []byte) error {
	linkerID, linkerTitle, err := f.findTransparenciaLinker(fromNodeID)
	if err != nil {
		return err
	}

	childLinks := parser.ExtractSedePageLinks(html, pageURL)
	if len(childLinks) == 0 {
		return nil
	}

	child := childLinks[0]
	if _, exists, err := f.store.GetNodeIDByURL(child.URL); err != nil {
		return err
	} else if exists {
		return nil
	}

	queue := []queueItem{{
		url:    child.URL,
		fromID: fromNodeID,
		label:  child.Label,
		depth:  0,
	}}
	sedeSeen := map[string]struct{}{pageURL: {}, child.URL: {}}

	_, _, err = f.walkQueue(ctx, linkerID, linkerTitle, child.Label, queue, sedeSeen)
	return err
}

func (f *Follower) walkQueue(
	ctx context.Context,
	linkerID int64,
	linkerTitle string,
	defaultLabel string,
	queue []queueItem,
	sedeSeen map[string]struct{},
) (int64, int64, error) {
	var firstNodeID, terminalNodeID int64

	for len(queue) > 0 {
		select {
		case <-ctx.Done():
			return firstNodeID, terminalNodeID, ctx.Err()
		default:
		}

		f.mu.Lock()
		atLimit := f.pages >= f.maxPages
		f.mu.Unlock()
		if atLimit {
			break
		}

		item := queue[0]
		queue = queue[1:]

		if item.depth > MaxDepth {
			continue
		}

		result, err := f.fetch.Fetch(ctx, item.url)
		f.mu.Lock()
		f.pages++
		f.mu.Unlock()
		if err != nil {
			log.Printf("sede fetch error %s: %v", item.url, err)
			continue
		}

		childLinks := parser.ExtractSedePageLinks(result.Body, item.url)
		title := parser.ExtractPageTitleFromHTML(result.Body)
		if title == "" {
			title = defaultLabel
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

		nodeID, err := f.store.UpsertNode(graph.UpsertNodeInput{
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
			return firstNodeID, terminalNodeID, err
		}

		if firstNodeID == 0 {
			firstNodeID = nodeID
		}

		if err := f.store.UpsertEdge(item.fromID, nodeID, item.label); err != nil {
			return firstNodeID, terminalNodeID, err
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

	return firstNodeID, terminalNodeID, nil
}

func (f *Follower) findTransparenciaLinker(nodeID int64) (int64, string, error) {
	for {
		node, err := f.store.GetNodeByID(nodeID)
		if err != nil {
			return 0, "", err
		}
		if node == nil {
			return 0, "", nil
		}
		if parser.IsPublicidadActivaURL(node.URL) {
			return node.ID, node.Title, nil
		}
		if node.ParentID == nil {
			return node.ID, node.Title, nil
		}
		nodeID = *node.ParentID
	}
}
