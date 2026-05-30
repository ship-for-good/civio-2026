package graph

import (
	"encoding/json"
	"fmt"
	"os"
)

const defaultGraphPath = "./graph.json"

// Graph holds the deserialized export and fast lookup by node ID.
type Graph struct {
	Export   GraphExport
	NodeByID map[int64]*ExportNode
}

// Load reads the graph from GRAPH_PATH, or ./graph.json if unset.
func Load() (*Graph, error) {
	path := os.Getenv("GRAPH_PATH")
	if path == "" {
		path = defaultGraphPath
	}
	return LoadFromFile(path)
}

// LoadFromFile reads and parses the graph JSON at path.
func LoadFromFile(path string) (*Graph, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read graph %q: %w", path, err)
	}

	var export GraphExport
	if err := json.Unmarshal(data, &export); err != nil {
		return nil, fmt.Errorf("parse graph %q: %w", path, err)
	}

	nodeByID := make(map[int64]*ExportNode, len(export.Nodes))
	for i := range export.Nodes {
		node := &export.Nodes[i]
		nodeByID[node.ID] = node
	}

	return &Graph{
		Export:   export,
		NodeByID: nodeByID,
	}, nil
}
