package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/civio/civio-2026/chatbot/graph"
	"github.com/civio/civio-2026/chatbot/llm"
)

const (
	msgFound = "✅ Sí, esa información está disponible en el **Portal de Transparencia**."
	msgNotFound = "🔎 Esa información no está publicada directamente. Puedes solicitarla mediante el **derecho de acceso** en https://transparencia.gob.es/derecho-acceso/solicite-informacion-publica"
	derechoAccesoURL = "https://transparencia.gob.es/derecho-acceso/solicite-informacion-publica"
)

// KeywordExtractor returns search terms for a citizen question.
type KeywordExtractor func(question string) ([]string, error)

// ResultVerifier checks whether a matched node answers the user's question.
type ResultVerifier func(question, nodeTitle, nodeDescription string) (bool, string, error)

// NavigationHintGenerator creates plain-language guidance for next steps.
type NavigationHintGenerator func(question, lastNodeTitle, lastNodeDescription, lastNodeURL string) (string, error)

// Handler serves POST /chat using a loaded graph.
type Handler struct {
	Graph           *graph.Graph
	extractKeywords KeywordExtractor
	verifyResult    ResultVerifier
	generateHint    NavigationHintGenerator
}

// New creates a chat handler from a loaded graph.
func New(g *graph.Graph) *Handler {
	return &Handler{
		Graph:           g,
		extractKeywords: llm.ExtractKeywords,
		verifyResult:    llm.VerifyResult,
		generateHint:    llm.GenerateNavigationHint,
	}
}

type chatRequest struct {
	Question string `json:"question"`
}

type chatResponse struct {
	Found       bool          `json:"found"`
	Message     string        `json:"message"`
	Hint        string        `json:"hint"`
	URL         string        `json:"url"`
	Path        []pathStep    `json:"path"`
	MatchedNode *matchedNode  `json:"matched_node"`
}

type pathStep struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

type matchedNode struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	PageType    string `json:"page_type"`
}

type errorResponse struct {
	Error string `json:"error"`
}

// Chat handles POST /chat. Enable CORS by wrapping with CORS middleware.
func (h *Handler) Chat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	var req chatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	req.Question = strings.TrimSpace(req.Question)
	if req.Question == "" {
		writeError(w, http.StatusBadRequest, "question is required")
		return
	}

	keywords, err := h.extractKeywords(req.Question)
	if err != nil {
		keywords = llm.ExtractKeywordsFallback(req.Question)
	}

	results := graph.TraverseSearch(keywords, h.Graph.NodeByID)
	node, explanation, verified := h.firstVerifiedResult(req.Question, results)
	if verified {
		writeJSON(w, http.StatusOK, chatResponse{
			Found:       true,
			Message:     msgFound,
			Hint:        "",
			URL:         node.URL,
			Path:        pathSteps(graph.BuildPath(node.ID, h.Graph.NodeByID)),
			MatchedNode: toMatchedNode(node),
		})
		return
	}
	if len(results) > 0 {
		last := results[len(results)-1].Node
		hint := h.navigationHint(req.Question, last)
		writeNotFound(w, notFoundMessage(explanation), hint)
		return
	}

	writeNotFound(w, msgNotFound, "")
}

// firstVerifiedResult tries up to the top 3 search results in order. It returns the
// first node that passes verification, or false with the last rejection explanation.
func (h *Handler) firstVerifiedResult(question string, results []graph.SearchResult) (*graph.ExportNode, string, bool) {
	limit := len(results)
	if limit > 3 {
		limit = 3
	}

	var lastExplanation string
	for i := 0; i < limit; i++ {
		node := results[i].Node
		if node == nil {
			continue
		}
		matched, explanation, err := h.verifyResult(question, node.Title, node.Description)
		if err != nil {
			return node, "", true
		}
		if matched {
			return node, "", true
		}
		lastExplanation = explanation
	}
	return nil, lastExplanation, false
}

func notFoundMessage(explanation string) string {
	explanation = strings.TrimSpace(explanation)
	if explanation == "" {
		return msgNotFound
	}
	return explanation + "\n\n– Si no aparece la información, puedes solicitarla mediante el **derecho de acceso** en " + derechoAccesoURL
}

func (h *Handler) navigationHint(question string, node *graph.ExportNode) string {
	if h.generateHint == nil || node == nil {
		return ""
	}
	hint, err := h.generateHint(question, node.Title, node.Description, node.URL)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(hint)
}

func writeNotFound(w http.ResponseWriter, message, hint string) {
	writeJSON(w, http.StatusOK, chatResponse{
		Found:       false,
		Message:     message,
		Hint:        hint,
		URL:         derechoAccesoURL,
		Path:        []pathStep{},
		MatchedNode: nil,
	})
}

// CORS wraps a handler with CORS headers and OPTIONS support.
func CORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func pathSteps(steps []graph.PathStep) []pathStep {
	out := make([]pathStep, len(steps))
	for i, s := range steps {
		out[i] = pathStep{Title: s.Title, URL: s.URL}
	}
	return out
}

func toMatchedNode(node *graph.ExportNode) *matchedNode {
	return &matchedNode{
		Title:       node.Title,
		Description: node.Description,
		PageType:    node.PageType,
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, errorResponse{Error: message})
}
