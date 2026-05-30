package llm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

const (
	geminiModel    = "gemini-2.0-flash"
	geminiBaseURL  = "https://generativelanguage.googleapis.com/v1beta/models"
	defaultTimeout = 30 * time.Second
)

// Client calls the Google Generative Language API (Gemini Flash).
type Client struct {
	apiKey     string
	httpClient *http.Client
}

// NewClient reads GEMINI_API_KEY from the environment.
func NewClient() (*Client, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: defaultTimeout,
		},
	}, nil
}

// ExtractKeywords asks Gemini Flash for 2–4 search terms for the given question.
func ExtractKeywords(question string) ([]string, error) {
	client, err := NewClient()
	if err != nil {
		return nil, err
	}
	return client.ExtractKeywords(question)
}

// ExtractKeywords calls Gemini with the keyword-extraction prompt from CURSOR.md.
func (c *Client) ExtractKeywords(question string) ([]string, error) {
	question = strings.TrimSpace(question)
	if question == "" {
		return nil, fmt.Errorf("question is empty")
	}

	text, err := c.generate(keywordPrompt(question))
	if err != nil {
		return nil, fmt.Errorf("extract keywords: %w", err)
	}
	return parseKeywords(text), nil
}

func keywordPrompt(question string) string {
	return fmt.Sprintf(`Eres un asistente que ayuda a encontrar información en el Portal de Transparencia español.
Dada la siguiente pregunta de un ciudadano, extrae entre 2 y 4 palabras clave
para buscar en el índice del portal. Devuelve SOLO las palabras separadas por comas,
sin explicaciones.

Pregunta: %s
Keywords:`, question)
}

func parseKeywords(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	keywords := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			keywords = append(keywords, p)
		}
	}
	return keywords
}

func (c *Client) generate(prompt string) (string, error) {
	url := fmt.Sprintf("%s/%s:generateContent?key=%s", geminiBaseURL, geminiModel, c.apiKey)

	body, err := json.Marshal(generateContentRequest{
		Contents: []content{
			{Parts: []part{{Text: prompt}}},
		},
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("gemini API %s: %s", resp.Status, strings.TrimSpace(string(respBody)))
	}

	var out generateContentResponse
	if err := json.Unmarshal(respBody, &out); err != nil {
		return "", err
	}
	if out.Error != nil && out.Error.Message != "" {
		return "", fmt.Errorf("gemini API: %s", out.Error.Message)
	}
	if len(out.Candidates) == 0 || len(out.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini API: empty response")
	}
	return strings.TrimSpace(out.Candidates[0].Content.Parts[0].Text), nil
}

type generateContentRequest struct {
	Contents []content `json:"contents"`
}

type content struct {
	Parts []part `json:"parts"`
}

type part struct {
	Text string `json:"text"`
}

type generateContentResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}
