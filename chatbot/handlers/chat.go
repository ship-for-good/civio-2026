package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/civio/civio-2026/chatbot/graph"
	"github.com/civio/civio-2026/chatbot/llm"
)

const (
	msgFound = "Sí, esa información está disponible en el Portal de Transparencia."
	msgNotFound = "Esa información no está publicada directamente. Puedes solicitarla mediante el derecho de acceso en https://transparencia.gob.es/derecho-acceso/solicite-informacion-publica"
	derechoAccesoURL = "https://transparencia.gob.es/derecho-acceso/solicite-informacion-publica"
)

// KeywordExtractor returns search terms for a citizen question.
type KeywordExtractor func(question string) ([]string, error)

// ResultVerifier checks whether a matched node answers the user's question.
type ResultVerifier func(question, nodeTitle, nodeDescription string) (bool, string, error)

// Handler serves POST /chat using a loaded graph.
type Handler struct {
	Graph           *graph.Graph
	extractKeywords KeywordExtractor
	verifyResult    ResultVerifier
}

// New creates a chat handler from a loaded graph.
func New(g *graph.Graph) *Handler {
	return &Handler{
		Graph:           g,
		extractKeywords: llm.ExtractKeywords,
		verifyResult:    llm.VerifyResult,
	}
}

type chatRequest struct {
	Question string `json:"question"`
}

type chatResponse struct {
	Found       bool          `json:"found"`
	Message     string        `json:"message"`
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
	if len(results) > 0 {
		node := results[0].Node
		matched, explanation, err := h.verifyResult(req.Question, node.Title, node.Description)
		if err == nil && !matched {
			writeNotFound(w, notFoundMessage(explanation))
			return
		}
		writeJSON(w, http.StatusOK, chatResponse{
			Found:       true,
			Message:     msgFound,
			URL:         node.URL,
			Path:        pathSteps(graph.BuildPath(node.ID, h.Graph.NodeByID)),
			MatchedNode: toMatchedNode(node),
		})
		return
	}

	writeNotFound(w, msgNotFound)
}

func notFoundMessage(explanation string) string {
	explanation = strings.TrimSpace(explanation)
	if explanation == "" {
		return msgNotFound
	}
	return explanation + " Puedes solicitarla mediante el derecho de acceso en " + derechoAccesoURL
}

func writeNotFound(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusOK, chatResponse{
		Found:       false,
		Message:     message,
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
