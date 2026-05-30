package graph

import (
	"sort"
	"strings"
)

// SearchResult is a ranked node match from TraverseSearch.
type SearchResult struct {
	NodeID int64
	Node   *ExportNode
	Score  int
}

// PathStep is one breadcrumb from root to the matched node.
type PathStep struct {
	Title string
	URL   string
}

// TraverseSearch scores every node reachable via BFS from the roots (and any
// disconnected nodes), then returns up to 3 matches ordered by score while
// prioritizing leaf_static and buscador_entry over navigation page types.
func TraverseSearch(keywords []string, nodes map[int64]*ExportNode) []SearchResult {
	normalized := normalizeKeywords(keywords)
	if len(normalized) == 0 || len(nodes) == 0 {
		return nil
	}

	children := buildChildrenMap(nodes)
	var results []SearchResult

	for _, node := range bfsNodes(nodes, children) {
		score := nodeScore(node, normalized)
		if score == 0 {
			continue
		}
		results = append(results, SearchResult{
			NodeID: node.ID,
			Node:   node,
			Score:  score,
		})
	}

	return topResultsByPageType(results, 3)
}

// bfsNodes visits all nodes: BFS from roots, then BFS on any disconnected nodes.
func bfsNodes(nodes map[int64]*ExportNode, children map[int64][]*ExportNode) []*ExportNode {
	visited := make(map[int64]bool, len(nodes))
	var order []*ExportNode

	runBFS := func(starts []*ExportNode) {
		queue := starts
		for head := 0; head < len(queue); head++ {
			node := queue[head]
			if node == nil || visited[node.ID] {
				continue
			}
			visited[node.ID] = true
			order = append(order, node)
			for _, child := range children[node.ID] {
				if !visited[child.ID] {
					queue = append(queue, child)
				}
			}
		}
	}

	runBFS(rootNodes(nodes))

	var disconnected []*ExportNode
	for _, node := range nodes {
		if !visited[node.ID] {
			disconnected = append(disconnected, node)
		}
	}
	sort.Slice(disconnected, func(i, j int) bool {
		return disconnected[i].ID < disconnected[j].ID
	})
	runBFS(disconnected)

	return order
}

func buildChildrenMap(nodes map[int64]*ExportNode) map[int64][]*ExportNode {
	children := make(map[int64][]*ExportNode)
	for _, node := range nodes {
		if node.ParentID == nil {
			continue
		}
		parentID := *node.ParentID
		children[parentID] = append(children[parentID], node)
	}
	for parentID := range children {
		sort.Slice(children[parentID], func(i, j int) bool {
			return children[parentID][i].ID < children[parentID][j].ID
		})
	}
	return children
}

func rootNodes(nodes map[int64]*ExportNode) []*ExportNode {
	var roots []*ExportNode
	for _, node := range nodes {
		if node.ParentID == nil {
			roots = append(roots, node)
		}
	}
	sort.Slice(roots, func(i, j int) bool {
		return roots[i].ID < roots[j].ID
	})
	return roots
}

func nodeScore(node *ExportNode, keywords []string) int {
	if node == nil {
		return 0
	}

	score := 0
	title := strings.ToLower(node.Title)
	description := strings.ToLower(node.Description)

	for _, kw := range keywords {
		if strings.Contains(title, kw) {
			score++
		}
		if strings.Contains(description, kw) {
			score++
		}
		for _, child := range node.ChildContents {
			childTitle := strings.ToLower(child.Title)
			childDescription := strings.ToLower(child.Description)
			if strings.Contains(childTitle, kw) {
				score++
			}
			if strings.Contains(childDescription, kw) {
				score++
			}
		}
	}
	return score
}

func isPreferredPageType(pageType string) bool {
	return pageType == "leaf_static" || pageType == "buscador_entry"
}

func topResultsByPageType(results []SearchResult, limit int) []SearchResult {
	if len(results) == 0 {
		return nil
	}
	sort.Slice(results, func(i, j int) bool {
		preferredI := isPreferredPageType(results[i].Node.PageType)
		preferredJ := isPreferredPageType(results[j].Node.PageType)
		if preferredI != preferredJ {
			return preferredI
		}
		if results[i].Score != results[j].Score {
			return results[i].Score > results[j].Score
		}
		return results[i].NodeID < results[j].NodeID
	})
	if len(results) > limit {
		results = results[:limit]
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
