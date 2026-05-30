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

func TestBuildPath(t *testing.T) {
	parent1 := int64(1)
	parent2 := int64(2)
	nodes := []ExportNode{
		{ID: 1, Title: "Publicidad Activa", URL: "https://example.com/publicidad-activa"},
		{ID: 2, Title: "Altos Cargos", URL: "https://example.com/altos-cargos", ParentID: &parent1},
		{ID: 3, Title: "Retribuciones", URL: "https://example.com/retribuciones", ParentID: &parent2},
	}
	_, nodeByID := testFixture(nodes)

	path := BuildPath(3, nodeByID)

	want := []PathStep{
		{Title: "Publicidad Activa", URL: nodes[0].URL},
		{Title: "Altos Cargos", URL: nodes[1].URL},
		{Title: "Retribuciones", URL: nodes[2].URL},
	}
	if len(path) != len(want) {
		t.Fatalf("len(path) = %d, want %d", len(path), len(want))
	}
	for i, step := range want {
		if path[i] != step {
			t.Errorf("path[%d] = %+v, want %+v", i, path[i], step)
		}
	}
}
