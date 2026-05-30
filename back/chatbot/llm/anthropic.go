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
	anthropicModel    = "claude-haiku-4-5-20251001"
	anthropicBaseURL  = "https://api.anthropic.com/v1/messages"
	anthropicVersion  = "2023-06-01"
	anthropicMaxTokens = 256
)

// AnthropicClient calls the Anthropic Messages API.
type AnthropicClient struct {
	apiKey     string
	httpClient *http.Client
}

// NewAnthropicClient reads ANTHROPIC_API_KEY from the environment.
func NewAnthropicClient() (*AnthropicClient, error) {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("ANTHROPIC_API_KEY is not set")
	}
	return &AnthropicClient{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: defaultTimeout,
		},
	}, nil
}

// ExtractKeywordsFallback splits the question into words, drops those shorter than 4
// characters, and returns up to the first 4 remaining terms.
func ExtractKeywordsFallback(question string) []string {
	var keywords []string
	for _, word := range strings.Fields(strings.TrimSpace(question)) {
		if len([]rune(word)) < 4 {
			continue
		}
		keywords = append(keywords, word)
		if len(keywords) == 4 {
			break
		}
	}
	return keywords
}

// ExtractKeywords asks Claude Haiku for 2–4 search terms for the given question.
func ExtractKeywords(question string) ([]string, error) {
	client, err := NewAnthropicClient()
	if err != nil {
		return nil, err
	}
	return client.ExtractKeywords(question)
}

// ExtractKeywords calls Anthropic with the keyword-extraction prompt from CURSOR.md.
func (c *AnthropicClient) ExtractKeywords(question string) ([]string, error) {
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

// VerifyResult asks Anthropic whether the matched node actually answers the question.
func VerifyResult(question, nodeTitle, nodeDescription string) (bool, string, error) {
	client, err := NewAnthropicClient()
	if err != nil {
		return false, "", err
	}
	return client.VerifyResult(question, nodeTitle, nodeDescription)
}

// VerifyResult calls Anthropic to validate that the node content fits the question.
func (c *AnthropicClient) VerifyResult(question, nodeTitle, nodeDescription string) (bool, string, error) {
	question = strings.TrimSpace(question)
	if question == "" {
		return false, "", fmt.Errorf("question is empty")
	}

	text, err := c.complete(verifyResultPrompt(question, nodeTitle, nodeDescription))
	if err != nil {
		return false, "", fmt.Errorf("verify result: %w", err)
	}
	return parseVerification(text)
}

// GenerateNavigationHint asks Anthropic for plain-language guidance on what to
// click or search within the selected page.
func GenerateNavigationHint(question, lastNodeTitle, lastNodeDescription, lastNodeURL string) (string, error) {
	client, err := NewAnthropicClient()
	if err != nil {
		return "", err
	}
	return client.GenerateNavigationHint(question, lastNodeTitle, lastNodeDescription, lastNodeURL)
}

// GenerateNavigationHint calls Anthropic to produce simple next-step instructions
// for users without institutional knowledge.
func (c *AnthropicClient) GenerateNavigationHint(question, lastNodeTitle, lastNodeDescription, lastNodeURL string) (string, error) {
	question = strings.TrimSpace(question)
	if question == "" {
		return "", fmt.Errorf("question is empty")
	}

	text, err := c.complete(navigationHintPrompt(question, lastNodeTitle, lastNodeDescription, lastNodeURL))
	if err != nil {
		return "", fmt.Errorf("generate navigation hint: %w", err)
	}
	return strings.TrimSpace(text), nil
}

func navigationHintPrompt(question, lastNodeTitle, lastNodeDescription, lastNodeURL string) string {
	return fmt.Sprintf(`Eres un asistente del Portal de Transparencia español.
El usuario NO tiene conocimientos institucionales ni técnicos.

Pregunta del usuario:
"%s"

Última página encontrada en el portal:
Título: %s
Descripción: %s
URL: %s

Escribe instrucciones claras y sencillas (2-4 frases) sobre qué debe buscar
o en qué enlace debe clicar dentro de esa página para acercarse a la respuesta.
Devuelve la respuesta en Markdown con este formato:
- Empieza con un emoji relevante.
- Usa **negritas** para los términos clave.
- Añade una lista de pasos con el prefijo "– " (guion largo).
No uses jerga técnica ni institucional.`, question, lastNodeTitle, lastNodeDescription, lastNodeURL)
}

func verifyResultPrompt(question, nodeTitle, nodeDescription string) string {
	return fmt.Sprintf(`Eres un asistente del Portal de Transparencia español.
Un ciudadano ha hecho esta pregunta:
"%s"

Se ha encontrado esta página del portal:
Título: %s
Descripción: %s

¿Esta página responde realmente a la pregunta del ciudadano?

Responde EXACTAMENTE en dos líneas:
VEREDICTO: SI o NO  (esta línea sin Markdown)
MENSAJE: empieza con un emoji y usa Markdown con **negritas** para términos clave; si VEREDICTO es NO, explica brevemente por qué no encaja.`, question, nodeTitle, nodeDescription)
}

func parseVerification(text string) (bool, string, error) {
	var matched bool
	var message string
	foundVerdict := false

	for _, line := range strings.Split(text, "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		clean := strings.ReplaceAll(line, "**", "")
		upper := strings.ToUpper(clean)
		if strings.HasPrefix(upper, "VEREDICTO:") {
			verdict := strings.TrimSpace(strings.TrimPrefix(upper, "VEREDICTO:"))
			matched = verdict == "SI" || strings.HasPrefix(verdict, "SI ")
			foundVerdict = true
			continue
		}
		if strings.HasPrefix(upper, "MENSAJE:") {
			_, rest, ok := strings.Cut(clean, ":")
			if ok {
				message = strings.TrimSpace(rest)
			}
		}
	}

	if !foundVerdict {
		return false, "", fmt.Errorf("could not parse verification response: %q", text)
	}
	if matched {
		message = ""
	}
	return matched, message, nil
}

func (c *AnthropicClient) complete(prompt string) (string, error) {
	body, err := json.Marshal(messagesRequest{
		Model:     anthropicModel,
		MaxTokens: anthropicMaxTokens,
		Messages: []anthropicMessage{
			{Role: "user", Content: prompt},
		},
	})
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, anthropicBaseURL, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", c.apiKey)
	req.Header.Set("anthropic-version", anthropicVersion)

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
		return "", fmt.Errorf("anthropic API %s: %s", resp.Status, strings.TrimSpace(string(respBody)))
	}

	var out messagesResponse
	if err := json.Unmarshal(respBody, &out); err != nil {
		return "", err
	}
	if out.Error != nil && out.Error.Message != "" {
		return "", fmt.Errorf("anthropic API: %s", out.Error.Message)
	}
	for _, block := range out.Content {
		if block.Type == "text" && strings.TrimSpace(block.Text) != "" {
			return strings.TrimSpace(block.Text), nil
		}
	}
	return "", fmt.Errorf("anthropic API: empty response")
}

type messagesRequest struct {
	Model     string             `json:"model"`
	MaxTokens int                `json:"max_tokens"`
	Messages  []anthropicMessage `json:"messages"`
}

type anthropicMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type messagesResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}
