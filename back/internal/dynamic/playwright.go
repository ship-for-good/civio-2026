package dynamic

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/playwright-community/playwright-go"
)

type ScraperConfig struct {
	TimeoutSec   int
	Headless     bool
	WaitSelector string
}

type Scraper struct {
	pw      *playwright.Playwright
	browser playwright.Browser
	cfg     ScraperConfig
}

func NewScraper(cfg ScraperConfig) (*Scraper, error) {
	if cfg.TimeoutSec <= 0 {
		cfg.TimeoutSec = 45
	}
	if cfg.WaitSelector == "" {
		cfg.WaitSelector = "main"
	}

	pw, err := playwright.Run()
	if err != nil {
		return nil, fmt.Errorf("start playwright: %w", err)
	}

	browser, err := pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(cfg.Headless),
	})
	if err != nil {
		pw.Stop()
		return nil, fmt.Errorf("launch chromium: %w", err)
	}

	return &Scraper{pw: pw, browser: browser, cfg: cfg}, nil
}

func (s *Scraper) Close() error {
	if s.browser != nil {
		_ = s.browser.Close()
	}
	if s.pw != nil {
		return s.pw.Stop()
	}
	return nil
}

func (s *Scraper) FetchRenderedHTML(ctx context.Context, url string) (string, error) {
	page, err := s.browser.NewPage()
	if err != nil {
		return "", err
	}
	defer page.Close()

	page.SetDefaultTimeout(float64(s.cfg.TimeoutSec * 1000))

	if _, err := page.Goto(url, playwright.PageGotoOptions{
		WaitUntil: playwright.WaitUntilStateDomcontentloaded,
	}); err != nil {
		return "", fmt.Errorf("goto %s: %w", url, err)
	}

	// Wait for main content or tables typical of AEM dynamic pages.
	selectors := []string{s.cfg.WaitSelector, "table", ".table-dintel", ".cmp-text"}
	if strings.Contains(url, "transparencia.sede.gob.es") {
		selectors = append([]string{
			"a[href*='/procedimiento']",
			"dnt-section",
			"form",
			"main",
		}, selectors...)
	}
	for _, sel := range selectors {
		if sel == "" {
			continue
		}
		_, _ = page.WaitForSelector(sel, playwright.PageWaitForSelectorOptions{
			Timeout: playwright.Float(15000),
		})
	}

	// Extra settle time for JS widgets / iframes.
	select {
	case <-ctx.Done():
		return "", ctx.Err()
	case <-time.After(2 * time.Second):
	}

	html, err := page.Content()
	if err != nil {
		return "", err
	}
	return html, nil
}
