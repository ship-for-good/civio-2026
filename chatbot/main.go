package main

import (
	"log"
	"net/http"
	"os"

	"github.com/civio/civio-2026/chatbot/graph"
	"github.com/civio/civio-2026/chatbot/handlers"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")

	g, err := graph.Load()
	if err != nil {
		log.Fatalf("load graph: %v", err)
	}

	h := handlers.New(g)
	http.HandleFunc("/chat", handlers.CORS(h.Chat))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	addr := ":" + port

	log.Printf("listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}
