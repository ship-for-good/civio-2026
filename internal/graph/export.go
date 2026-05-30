package graph

import (
	"encoding/json"
	"os"
	"time"

	"github.com/civio/civio-2026/internal/models"
	"github.com/civio/civio-2026/internal/parser"
)

func ExportJSON(store *Store, outPath string) error {
	nodes, err := store.AllNodes()
	if err != nil {
		return err
	}
	edges, err := store.AllEdges()
	if err != nil {
		return err
	}

	export := models.GraphExport{
		Meta: models.ExportMeta{
			ScrapedAt: time.Now().UTC().Format(time.RFC3339),
			NodeCount: len(nodes),
			EdgeCount: len(edges),
		},
		Nodes: make([]models.ExportNode, 0, len(nodes)),
		Edges: make([]models.ExportEdge, 0, len(edges)),
	}

	for _, n := range nodes {
		export.Nodes = append(export.Nodes, models.ExportNode{
			ID:               n.ID,
			URL:              n.URL,
			Title:            n.Title,
			Description:      n.Description,
			Path:             n.Path,
			Depth:            n.Depth,
			PageType:         string(n.PageType),
			ParentID:         n.ParentID,
			ContentUpdatedAt: parser.FormatRFC3339(n.ContentUpdatedAt),
			HTTPLastModified: parser.FormatRFC3339(n.HTTPLastModified),
			HTTPEtag:         n.HTTPEtag,
			ScrapedAt:        parser.FormatRFC3339(n.ScrapedAt),
		})
	}

	for _, e := range edges {
		export.Edges = append(export.Edges, models.ExportEdge{
			From:  e.FromID,
			To:    e.ToID,
			Label: e.Label,
		})
	}

	data, err := json.MarshalIndent(export, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(outPath, data, 0o644)
}
