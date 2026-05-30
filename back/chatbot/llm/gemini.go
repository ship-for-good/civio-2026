package llm

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
)

const (
	geminiModel   = "gemini-2.0-flash-lite"
	geminiBaseURL = "https://generativelanguage.googleapis.com/v1beta/models"
)

// GeminiClient calls the Google Generative Language API (Gemini Flash).
type GeminiClient struct {
	apiKey     string
	httpClient *http.Client
}

// NewGeminiClient reads GEMINI_API_KEY from the environment.
func NewGeminiClient() (*GeminiClient, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY is not set")
	}
	return &GeminiClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: defaultTimeout,
		},
	}, nil
}

// GeminiExtractKeywords asks Gemini Flash for 2–4 search terms for the given question.
func GeminiExtractKeywords(question string) ([]string, error) {
	client, err := NewGeminiClient()
	if err != nil {
		return nil, err
	}
	return client.ExtractKeywords(question)
}

// ExtractKeywords calls Gemini with the keyword-extraction prompt from CURSOR.md.
func (c *GeminiClient) ExtractKeywords(question string) ([]string, error) {
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

func (c *GeminiClient) generate(prompt string) (string, error) {
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
