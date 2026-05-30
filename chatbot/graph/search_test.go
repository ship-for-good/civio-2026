package graph

import (
	"testing"
)

func testNodeByID(nodes []ExportNode) map[int64]*ExportNode {
	nodeByID := make(map[int64]*ExportNode, len(nodes))
	for i := range nodes {
		nodeByID[nodes[i].ID] = &nodes[i]
	}
	return nodeByID
}

func TestTraverseSearch_exactTitleMatch(t *testing.T) {
	nodes := []ExportNode{
		{ID: 1, Title: "Retribuciones de Altos Cargos", Description: ""},
		{ID: 2, Title: "Derecho de acceso", Description: "Formulario de solicitud"},
	}
	nodeByID := testNodeByID(nodes)

	results := TraverseSearch([]string{"retribuciones", "altos", "cargos"}, nodeByID)

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

func TestTraverseSearch_partialDescriptionMatch(t *testing.T) {
	nodes := []ExportNode{
		{
			ID:          10,
			Title:       "Publicidad Activa",
			Description: "Acceso a datos de subvenciones y ayudas públicas",
		},
		{ID: 11, Title: "Altos Cargos", Description: "Retribuciones y bienes"},
	}
	nodeByID := testNodeByID(nodes)

	results := TraverseSearch([]string{"subvenciones"}, nodeByID)

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

func TestTraverseSearch_noResults(t *testing.T) {
	nodes := []ExportNode{
		{ID: 1, Title: "Retribuciones", Description: "Altos cargos del Estado"},
		{ID: 2, Title: "Contratos", Description: "Adjudicaciones públicas"},
	}
	nodeByID := testNodeByID(nodes)

	results := TraverseSearch([]string{"meteorología", "clima"}, nodeByID)

	if len(results) != 0 {
		t.Fatalf("len(results) = %d, want 0; got %+v", len(results), results)
	}
}

func TestTraverseSearch_prefersLeafOverIntermediate(t *testing.T) {
	parent1 := int64(1)
	nodes := []ExportNode{
		{ID: 1, Title: "Sección", Description: "contratos", PageType: "navigation"},
		{
			ID:       2,
			Title:    "Detalle contratos",
			URL:      "https://example.com/contratos",
			PageType: "leaf_static",
			ParentID: &parent1,
		},
	}
	nodeByID := testNodeByID(nodes)

	results := TraverseSearch([]string{"contratos"}, nodeByID)

	if len(results) == 0 {
		t.Fatal("expected at least one result")
	}
	if results[0].NodeID != 2 {
		t.Errorf("results[0].NodeID = %d, want leaf node 2 ranked first", results[0].NodeID)
	}
	if results[0].Node.PageType != "leaf_static" {
		t.Errorf("results[0] page_type = %q, want leaf_static", results[0].Node.PageType)
	}
}

func TestTraverseSearch_findsMatchInSiblingBranch(t *testing.T) {
	parent1 := int64(1)
	nodes := []ExportNode{
		{ID: 1, Title: "Raíz", Description: "portal general", PageType: "navigation"},
		{ID: 2, Title: "Contratos", Description: "adjudicaciones públicas", ParentID: &parent1, PageType: "navigation"},
		{ID: 3, Title: "Subvenciones", Description: "ayudas públicas", ParentID: &parent1, PageType: "navigation"},
	}
	nodeByID := testNodeByID(nodes)

	results := TraverseSearch([]string{"subvenciones"}, nodeByID)

	if len(results) != 1 {
		t.Fatalf("len(results) = %d, want 1", len(results))
	}
	if results[0].NodeID != 3 {
		t.Errorf("NodeID = %d, want 3 (sibling branch, not greedy-first branch)", results[0].NodeID)
	}
}

func TestTraverseSearch_returnsIntermediateWhenNoLeaves(t *testing.T) {
	parent1 := int64(1)
	nodes := []ExportNode{
		{ID: 1, Title: "Raíz", Description: "información general"},
		{ID: 2, Title: "Subvenciones públicas", Description: "listado", ParentID: &parent1, PageType: "navigation"},
	}
	nodeByID := testNodeByID(nodes)

	results := TraverseSearch([]string{"subvenciones"}, nodeByID)

	if len(results) != 1 {
		t.Fatalf("len(results) = %d, want 1", len(results))
	}
	if results[0].NodeID != 2 {
		t.Errorf("NodeID = %d, want intermediate node 2", results[0].NodeID)
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
	nodeByID := testNodeByID(nodes)

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
