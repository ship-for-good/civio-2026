package main

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"

	"github.com/civio/civio-2026/internal/crawler"
	"github.com/civio/civio-2026/internal/dynamic"
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
	root.AddCommand(enrichCmd(&dbPath))
	root.AddCommand(scrapeDynamicCmd(&dbPath))

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

func enrichCmd(dbPath *string) *cobra.Command {
	return &cobra.Command{
		Use:   "enrich",
		Short: "Rebuild child content summaries for parent nodes",
		RunE: func(cmd *cobra.Command, args []string) error {
			store, err := graph.Open(*dbPath)
			if err != nil {
				return err
			}
			defer store.Close()

			if err := graph.RefreshChildContents(store); err != nil {
				return err
			}

			withChildren, err := store.CountParentsWithChildren()
			if err != nil {
				return err
			}
			stats, err := store.Stats()
			if err != nil {
				return err
			}

			fmt.Printf("Enriched %d parent nodes with child content lists (of %d total nodes)\n", withChildren, stats.TotalNodes)
			return nil
		},
	}
}

func scrapeDynamicCmd(dbPath *string) *cobra.Command {
	var (
		types         string
		limit         int
		skipUnchanged bool
		force         bool
		headless      bool
		timeoutSec    int
	)

	cmd := &cobra.Command{
		Use:   "scrape-dynamic",
		Short: "Scrape non-static pages with Playwright (requires Chromium)",
		Long: `Renders pages in headless Chromium and extracts tables/text into dynamic_content.

Requires Playwright browsers. Use the crawler-playwright Docker service:
  docker compose run --rm crawler-playwright scrape-dynamic --db /data/graph.db`,
		RunE: func(cmd *cobra.Command, args []string) error {
			store, err := graph.Open(*dbPath)
			if err != nil {
				return err
			}
			defer store.Close()

			pageTypes := strings.Split(types, ",")
			for i := range pageTypes {
				pageTypes[i] = strings.TrimSpace(pageTypes[i])
			}

			result, err := dynamic.Run(context.Background(), store, dynamic.RunConfig{
				PageTypes:     pageTypes,
				Limit:         limit,
				SkipUnchanged: skipUnchanged && !force,
				Headless:      headless,
				TimeoutSec:    timeoutSec,
			})
			if err != nil {
				return err
			}

			fmt.Printf("Dynamic scrape: %d processed, %d skipped, %d errors\n",
				result.Processed, result.Skipped, result.Errors)
			return nil
		},
	}

	cmd.Flags().StringVar(&types, "types", "leaf_dynamic", "Comma-separated page_type values to scrape")
	cmd.Flags().IntVar(&limit, "limit", 0, "Max nodes to process (0 = all)")
	cmd.Flags().BoolVar(&skipUnchanged, "skip-unchanged", true, "Skip nodes whose dynamic content hash is unchanged")
	cmd.Flags().BoolVar(&force, "force", false, "Re-scrape even if content hash matches")
	cmd.Flags().BoolVar(&headless, "headless", true, "Run browser headless")
	cmd.Flags().IntVar(&timeoutSec, "timeout", 45, "Page load timeout in seconds")

	return cmd
}
