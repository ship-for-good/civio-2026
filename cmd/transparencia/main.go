package main

import (
	"context"
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/civio/civio-2026/internal/crawler"
	"github.com/civio/civio-2026/internal/graph"
)

const defaultDB = "data/graph.db"

func main() {
	root := &cobra.Command{
		Use:   "transparencia",
		Short: "Crawler del grafo de Publicidad Activa en transparencia.gob.es",
	}

	var dbPath string
	root.PersistentFlags().StringVar(&dbPath, "db", defaultDB, "SQLite database path")

	root.AddCommand(crawlCmd(&dbPath))
	root.AddCommand(statsCmd(&dbPath))
	root.AddCommand(exportCmd(&dbPath))

	if err := root.Execute(); err != nil {
		os.Exit(1)
	}
}

func crawlCmd(dbPath *string) *cobra.Command {
	var (
		seed          string
		workers       int
		rate          float64
		maxPages      int
		skipUnchanged bool
		forceRescrape bool
	)

	cmd := &cobra.Command{
		Use:   "crawl",
		Short: "Crawl publicidad activa and build the navigation graph",
		RunE: func(cmd *cobra.Command, args []string) error {
			store, err := graph.Open(*dbPath)
			if err != nil {
				return err
			}
			defer store.Close()

			cfg := crawler.Config{
				SeedURL:       seed,
				Workers:       workers,
				RateLimit:     rate,
				MaxPages:      maxPages,
				SkipUnchanged: skipUnchanged && !forceRescrape,
			}

			return crawler.RunBFS(context.Background(), store, cfg)
		},
	}

	cmd.Flags().StringVar(&seed, "seed", "https://transparencia.gob.es/publicidad-activa", "Starting URL")
	cmd.Flags().IntVar(&workers, "workers", 5, "Concurrent workers (reserved for future use)")
	cmd.Flags().Float64Var(&rate, "rate", 3, "Max HTTP requests per second")
	cmd.Flags().IntVar(&maxPages, "max-pages", 10000, "Maximum pages to crawl")
	cmd.Flags().BoolVar(&skipUnchanged, "skip-unchanged", true, "Skip re-processing pages whose ETag, Last-Modified or hash match stored values")
	cmd.Flags().BoolVar(&forceRescrape, "force", false, "Force re-scrape all pages even if unchanged")

	return cmd
}

func statsCmd(dbPath *string) *cobra.Command {
	return &cobra.Command{
		Use:   "stats",
		Short: "Show graph statistics",
		RunE: func(cmd *cobra.Command, args []string) error {
			store, err := graph.Open(*dbPath)
			if err != nil {
				return err
			}
			defer store.Close()

			stats, err := store.Stats()
			if err != nil {
				return err
			}

			fmt.Print(graph.FormatStats(stats))
			return nil
		},
	}
}

func exportCmd(dbPath *string) *cobra.Command {
	var (
		format string
		out    string
	)

	cmd := &cobra.Command{
		Use:   "export",
		Short: "Export graph to JSON",
		RunE: func(cmd *cobra.Command, args []string) error {
			if format != "json" {
				return fmt.Errorf("unsupported format: %s", format)
			}

			store, err := graph.Open(*dbPath)
			if err != nil {
				return err
			}
			defer store.Close()

			return graph.ExportJSON(store, out)
		},
	}

	cmd.Flags().StringVar(&format, "format", "json", "Export format")
	cmd.Flags().StringVar(&out, "out", "data/graph.json", "Output file path")

	return cmd
}
