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
	openAIModel = "gpt-4o-mini"
	openAIBase  = "https://api.openai.com/v1/chat/completions"
)

// OpenAIClient calls the OpenAI Chat Completions API.
type OpenAIClient struct {
	apiKey     string
	httpClient *http.Client
}

// NewOpenAIClient reads OPENAI_API_KEY from the environment.
func NewOpenAIClient() (*OpenAIClient, error) {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("OPENAI_API_KEY is not set")
	}
	return &OpenAIClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: defaultTimeout,
		},
	}, nil
}

// OpenAIExtractKeywords asks gpt-4o-mini for 2–4 search terms for the given question.
func OpenAIExtractKeywords(question string) ([]string, error) {
	client, err := NewOpenAIClient()
	if err != nil {
		return nil, err
	}
	return client.ExtractKeywords(question)
}

// ExtractKeywords calls OpenAI with the keyword-extraction prompt from CURSOR.md.
func (c *OpenAIClient) ExtractKeywords(question string) ([]string, error) {
	question = strings.TrimSpace(question)
	if question == "" {
		return nil, fmt.Errorf("question is empty")
	}

	text, err := c.complete(keywordPrompt(question))
	if err != nil {
		return nil, fmt.Errorf("extract keywords: %w", err)
	}
	return parseKeywords(text), nil
}

func (c *OpenAIClient) complete(prompt string) (string, error) {
	body, err := json.Marshal(chatCompletionRequest{
		Model: openAIModel,
		Messages: []chatMessage{
			{Role: "user", Content: prompt},
		},
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, openAIBase, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.apiKey)

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
		return "", fmt.Errorf("openai API %s: %s", resp.Status, strings.TrimSpace(string(respBody)))
	}

	var out chatCompletionResponse
	if err := json.Unmarshal(respBody, &out); err != nil {
		return "", err
	}
	if out.Error != nil && out.Error.Message != "" {
		return "", fmt.Errorf("openai API: %s", out.Error.Message)
	}
	if len(out.Choices) == 0 {
		return "", fmt.Errorf("openai API: empty response")
	}
	return strings.TrimSpace(out.Choices[0].Message.Content), nil
}

type chatCompletionRequest struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatCompletionResponse struct {
	Choices []struct {
		Message chatMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}
