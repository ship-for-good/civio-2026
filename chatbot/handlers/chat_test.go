package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/civio/civio-2026/chatbot/graph"
)

func testGraph(nodes []graph.ExportNode) *graph.Graph {
	nodeByID := make(map[int64]*graph.ExportNode, len(nodes))
	for i := range nodes {
		nodeByID[nodes[i].ID] = &nodes[i]
	}
	return &graph.Graph{
		Export:   graph.GraphExport{Nodes: nodes},
		NodeByID: nodeByID,
	}
}

func testHandler(g *graph.Graph, keywords KeywordExtractor) *Handler {
	h := New(g)
	h.extractKeywords = keywords
	return h
}

func postChat(t *testing.T, h *Handler, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/chat", strings.NewReader(body))
	rec := httptest.NewRecorder()
	h.Chat(rec, req)
	return rec
}

func decodeChatResponse(t *testing.T, rec *httptest.ResponseRecorder) chatResponse {
	t.Helper()
	var resp chatResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	return resp
}

func TestChat_foundResult(t *testing.T) {
	parent1 := int64(1)
	nodes := []graph.ExportNode{
		{ID: 1, Title: "Publicidad Activa", URL: "https://example.com/publicidad-activa"},
		{
			ID:          2,
			Title:       "Retribuciones de Altos Cargos",
			URL:         "https://example.com/retribuciones",
			Description: "Información sobre altos cargos",
			ParentID:    &parent1,
		},
	}
	h := testHandler(testGraph(nodes), func(string) ([]string, error) {
		return []string{"retribuciones", "altos", "cargos"}, nil
	})

	rec := postChat(t, h, `{"question":"¿Dónde están las retribuciones de altos cargos?"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", rec.Code, rec.Body.String())
	}

	resp := decodeChatResponse(t, rec)
	if !resp.Found {
		t.Fatal("found = false, want true")
	}
	if resp.URL == "" {
		t.Error("url is empty, want matched node URL")
	}
	if len(resp.Path) == 0 {
		t.Error("path is empty, want breadcrumb from root to leaf")
	}
	if resp.MatchedNode == nil {
		t.Fatal("matched_node is nil, want node summary")
	}
}

func TestChat_notFound_returnsDerechoAcceso(t *testing.T) {
	parent2 := int64(2)
	nodes := []graph.ExportNode{
		{ID: 1, Title: "Contratos", URL: "https://example.com/contratos", Description: "adjudicaciones"},
		{ID: 2, Title: "Derecho de acceso", URL: "https://transparencia.gob.es/derecho-acceso"},
		{
			ID:       3,
			Title:    "Solicite información pública",
			URL:      "https://transparencia.gob.es/derecho-acceso/solicite-informacion-publica",
			ParentID: &parent2,
		},
	}
	wantURL := nodes[2].URL
	h := testHandler(testGraph(nodes), func(string) ([]string, error) {
		return []string{"meteorología", "clima"}, nil
	})

	rec := postChat(t, h, `{"question":"¿Cuál es el tiempo en Madrid?"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", rec.Code, rec.Body.String())
	}

	resp := decodeChatResponse(t, rec)
	if resp.Found {
		t.Fatal("found = true, want false")
	}
	if resp.URL != wantURL {
		t.Errorf("url = %q, want derecho de acceso node %q", resp.URL, wantURL)
	}
	if resp.MatchedNode != nil {
		t.Errorf("matched_node = %+v, want null", resp.MatchedNode)
	}
}

func TestChat_emptyQuestion_returns400(t *testing.T) {
	h := testHandler(testGraph(nil), func(string) ([]string, error) {
		t.Fatal("ExtractKeywords should not be called for empty question")
		return nil, nil
	})

	rec := postChat(t, h, `{"question":"   "}`)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want 400; body: %s", rec.Code, rec.Body.String())
	}

	var errResp errorResponse
	if err := json.NewDecoder(rec.Body).Decode(&errResp); err != nil {
		t.Fatalf("decode error response: %v", err)
	}
	if errResp.Error == "" {
		t.Error("error message is empty")
	}
}
