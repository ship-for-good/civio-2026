package graph

import (
	"testing"
)

func testFixture(nodes []ExportNode) ([]SearchEntry, map[int64]*ExportNode) {
	nodeByID := make(map[int64]*ExportNode, len(nodes))
	for i := range nodes {
		nodeByID[nodes[i].ID] = &nodes[i]
	}
	return BuildIndex(nodes), nodeByID
}

func TestSearch_exactTitleMatch(t *testing.T) {
	nodes := []ExportNode{
		{ID: 1, Title: "Retribuciones de Altos Cargos", Description: ""},
		{ID: 2, Title: "Derecho de acceso", Description: "Formulario de solicitud"},
	}
	index, nodeByID := testFixture(nodes)

	results := Search([]string{"retribuciones", "altos", "cargos"}, index, nodeByID)

	if len(results) != 1 {
		t.Fatalf("len(results) = %d, want 1", len(results))
	}
	if results[0].NodeID != 1 {
		t.Errorf("NodeID = %d, want 1", results[0].NodeID)
	}
	if results[0].Score != 3 {
		t.Errorf("Score = %d, want 3", results[0].Score)
	}
	if results[0].Node.Title != "Retribuciones de Altos Cargos" {
		t.Errorf("Title = %q, want exact title match", results[0].Node.Title)
	}
}

func TestSearch_partialDescriptionMatch(t *testing.T) {
	nodes := []ExportNode{
		{
			ID:          10,
			Title:       "Publicidad Activa",
			Description: "Acceso a datos de subvenciones y ayudas públicas",
		},
		{ID: 11, Title: "Altos Cargos", Description: "Retribuciones y bienes"},
	}
	index, nodeByID := testFixture(nodes)

	results := Search([]string{"subvenciones"}, index, nodeByID)

	if len(results) != 1 {
		t.Fatalf("len(results) = %d, want 1", len(results))
	}
	if results[0].NodeID != 10 {
		t.Errorf("NodeID = %d, want 10 (match in description, not title)", results[0].NodeID)
	}
	if results[0].Score != 1 {
		t.Errorf("Score = %d, want 1", results[0].Score)
	}
}

func TestSearch_noResults(t *testing.T) {
	nodes := []ExportNode{
		{ID: 1, Title: "Retribuciones", Description: "Altos cargos del Estado"},
		{ID: 2, Title: "Contratos", Description: "Adjudicaciones públicas"},
	}
	index, nodeByID := testFixture(nodes)

	results := Search([]string{"meteorología", "clima"}, index, nodeByID)

	if len(results) != 0 {
		t.Fatalf("len(results) = %d, want 0; got %+v", len(results), results)
	}
}
