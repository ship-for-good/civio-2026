package graph

import (
	"sort"
	"strings"
)

// SearchEntry is one searchable row for a graph node (title, description, child contents).
type SearchEntry struct {
	NodeID     int64
	SearchText string // lowercase text used for keyword matching
}

// SearchResult is a ranked node match from Search.
type SearchResult struct {
	NodeID int64
	Node   *ExportNode
	Score  int // number of keyword matches
}

// PathStep is one breadcrumb from root to the matched node.
type PathStep struct {
	Title string
	URL   string
}

// BuildIndex builds a search entry per node from title, description, and child contents.
func BuildIndex(nodes []ExportNode) []SearchEntry {
	index := make([]SearchEntry, len(nodes))
	for i := range nodes {
		node := &nodes[i]
		index[i] = SearchEntry{
			NodeID:     node.ID,
			SearchText: strings.ToLower(buildSearchText(node)),
		}
	}
	return index
}

func buildSearchText(node *ExportNode) string {
	var b strings.Builder
	b.WriteString(node.Title)
	b.WriteByte(' ')
	b.WriteString(node.Description)
	for _, child := range node.ChildContents {
		b.WriteByte(' ')
		b.WriteString(child.Title)
		b.WriteByte(' ')
		b.WriteString(child.Description)
	}
	return b.String()
}

// Search returns up to 3 nodes with the highest keyword match scores.
func Search(keywords []string, index []SearchEntry, nodeByID map[int64]*ExportNode) []SearchResult {
	normalized := normalizeKeywords(keywords)
	if len(normalized) == 0 {
		return nil
	}

	var results []SearchResult
	for _, entry := range index {
		score := matchScore(entry.SearchText, normalized)
		if score == 0 {
			continue
		}
		node := nodeByID[entry.NodeID]
		if node == nil {
			continue
		}
		results = append(results, SearchResult{
			NodeID: entry.NodeID,
			Node:   node,
			Score:  score,
		})
	}

	sort.Slice(results, func(i, j int) bool {
		if results[i].Score != results[j].Score {
			return results[i].Score > results[j].Score
		}
		return results[i].NodeID < results[j].NodeID
	})

	if len(results) > 3 {
		results = results[:3]
	}
	return results
}

func normalizeKeywords(keywords []string) []string {
	var out []string
	for _, kw := range keywords {
		kw = strings.ToLower(strings.TrimSpace(kw))
		if kw == "" {
			continue
		}
		out = append(out, kw)
	}
	return out
}

// matchScore counts how many keywords appear in text (each keyword at most once).
func matchScore(text string, keywords []string) int {
	score := 0
	for _, kw := range keywords {
		if strings.Contains(text, kw) {
			score++
		}
	}
	return score
}

// BuildPath walks parent_id from nodeID to the root and returns steps root → leaf.
func BuildPath(nodeID int64, nodeByID map[int64]*ExportNode) []PathStep {
	node, ok := nodeByID[nodeID]
	if !ok {
		return nil
	}

	var chain []*ExportNode
	for cur := node; cur != nil; {
		chain = append(chain, cur)
		if cur.ParentID == nil {
			break
		}
		parent, ok := nodeByID[*cur.ParentID]
		if !ok {
			break
		}
		cur = parent
	}

	path := make([]PathStep, len(chain))
	for i, n := range chain {
		path[len(chain)-1-i] = PathStep{Title: n.Title, URL: n.URL}
	}
	return path
}
