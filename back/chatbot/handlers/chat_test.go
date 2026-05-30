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
	return testHandlerWithVerifier(g, keywords, func(string, string, string) (bool, string, error) {
		return true, "", nil
	}, func(string, string, string, string) (string, error) {
		return "", nil
	})
}

func testHandlerWithVerifier(
	g *graph.Graph,
	keywords KeywordExtractor,
	verify ResultVerifier,
	hint NavigationHintGenerator,
) *Handler {
	h := New(g)
	h.extractKeywords = keywords
	h.verifyResult = verify
	h.generateHint = hint
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

func TestChat_notFound_returnsFixedDerechoAcceso(t *testing.T) {
	nodes := []graph.ExportNode{
		{ID: 1, Title: "Contratos", URL: "https://example.com/contratos", Description: "adjudicaciones"},
	}
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
	if resp.URL != derechoAccesoURL {
		t.Errorf("url = %q, want %q", resp.URL, derechoAccesoURL)
	}
	if !strings.Contains(resp.Message, derechoAccesoURL) {
		t.Errorf("message = %q, want URL in message", resp.Message)
	}
	if len(resp.Path) != 0 {
		t.Errorf("path = %+v, want empty", resp.Path)
	}
	if resp.MatchedNode != nil {
		t.Errorf("matched_node = %+v, want null", resp.MatchedNode)
	}
}

func TestChat_verifySecondResultAccepted(t *testing.T) {
	nodes := []graph.ExportNode{
		{ID: 1, Title: "Contratos", URL: "https://example.com/contratos", Description: "adjudicaciones"},
		{ID: 2, Title: "Retribuciones de altos cargos", URL: "https://example.com/retribuciones", Description: "retribuciones"},
	}
	h := testHandlerWithVerifier(testGraph(nodes), func(string) ([]string, error) {
		return []string{"contratos", "retribuciones"}, nil
	}, func(_ string, title, _ string) (bool, string, error) {
		if strings.Contains(strings.ToLower(title), "contratos") {
			return false, "No trata sobre retribuciones.", nil
		}
		return true, "", nil
	}, func(string, string, string, string) (string, error) {
		return "", nil
	})

	rec := postChat(t, h, `{"question":"¿Cuáles son las retribuciones de los altos cargos?"}`)
	resp := decodeChatResponse(t, rec)

	if !resp.Found {
		t.Fatal("found = false, want true using second verified result")
	}
	if resp.URL != nodes[1].URL {
		t.Errorf("url = %q, want second result %q", resp.URL, nodes[1].URL)
	}
}

func TestChat_verifyRejected_returnsNotFound(t *testing.T) {
	nodes := []graph.ExportNode{
		{ID: 1, Title: "Contratos", URL: "https://example.com/contratos", Description: "adjudicaciones"},
	}
	h := testHandlerWithVerifier(testGraph(nodes), func(string) ([]string, error) {
		return []string{"contratos"}, nil
	}, func(string, string, string) (bool, string, error) {
		return false, "Esta página trata sobre contratos, no sobre retribuciones.", nil
	}, func(string, string, string, string) (string, error) {
		return "Busca el apartado de retribuciones en el menú de la página.", nil
	})

	rec := postChat(t, h, `{"question":"¿Cuáles son las retribuciones de los altos cargos?"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", rec.Code, rec.Body.String())
	}

	resp := decodeChatResponse(t, rec)
	if resp.Found {
		t.Fatal("found = true, want false after verification rejection")
	}
	if !strings.Contains(resp.Message, "retribuciones") {
		t.Errorf("message = %q, want LLM explanation", resp.Message)
	}
	if !strings.Contains(resp.Message, derechoAccesoURL) {
		t.Errorf("message = %q, want derecho de acceso URL", resp.Message)
	}
	if resp.URL != derechoAccesoURL {
		t.Errorf("url = %q, want %q", resp.URL, derechoAccesoURL)
	}
	if resp.Hint == "" {
		t.Error("hint is empty, want guidance text")
	}
}

func TestChat_notFound_hintFailureDoesNotBreakResponse(t *testing.T) {
	nodes := []graph.ExportNode{
		{ID: 1, Title: "Contratos", URL: "https://example.com/contratos", Description: "adjudicaciones"},
	}
	h := testHandlerWithVerifier(testGraph(nodes), func(string) ([]string, error) {
		return []string{"contratos"}, nil
	}, func(string, string, string) (bool, string, error) {
		return false, "No encaja con la pregunta.", nil
	}, func(string, string, string, string) (string, error) {
		return "", http.ErrHandlerTimeout
	})

	rec := postChat(t, h, `{"question":"¿Dónde están las retribuciones?"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200; body: %s", rec.Code, rec.Body.String())
	}

	resp := decodeChatResponse(t, rec)
	if resp.Hint != "" {
		t.Errorf("hint = %q, want empty on hint failure", resp.Hint)
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
