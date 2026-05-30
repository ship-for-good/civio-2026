package llm

import (
	"fmt"
	"strings"
	"time"
)

const defaultTimeout = 30 * time.Second

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
