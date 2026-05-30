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
