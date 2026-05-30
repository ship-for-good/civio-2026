package graph

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"

	"github.com/civio/civio-2026/internal/models"
)

type Store struct {
	db *sql.DB
}

func Open(dbPath string) (*Store, error) {
	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		return nil, err
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(1)

	store := &Store{db: db}
	if err := store.migrate(); err != nil {
		db.Close()
		return nil, err
	}

	return store, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) migrate() error {
	schema := `
CREATE TABLE IF NOT EXISTS nodes (
  id INTEGER PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  path TEXT NOT NULL,
  title TEXT,
  description TEXT,
  depth INTEGER,
  page_type TEXT NOT NULL,
  parent_id INTEGER REFERENCES nodes(id),
  html_hash TEXT,
  content_updated_at TEXT,
  http_last_modified TEXT,
  http_etag TEXT,
  scraped_at TEXT
);

CREATE TABLE IF NOT EXISTS edges (
  id INTEGER PRIMARY KEY,
  from_id INTEGER NOT NULL REFERENCES nodes(id),
  to_id INTEGER NOT NULL REFERENCES nodes(id),
  label TEXT,
  UNIQUE(from_id, to_id)
);

CREATE TABLE IF NOT EXISTS crawl_runs (
  id INTEGER PRIMARY KEY,
  started_at TEXT,
  finished_at TEXT,
  nodes_found INTEGER,
  errors INTEGER
);
`
	_, err := s.db.Exec(schema)
	if err != nil {
		return err
	}

	_, err = s.db.Exec(`ALTER TABLE nodes ADD COLUMN description TEXT`)
	if err != nil && !strings.Contains(err.Error(), "duplicate column") {
		return err
	}

	for _, col := range []string{
		`ALTER TABLE nodes ADD COLUMN content_updated_at TEXT`,
		`ALTER TABLE nodes ADD COLUMN http_last_modified TEXT`,
		`ALTER TABLE nodes ADD COLUMN http_etag TEXT`,
	} {
		if _, err := s.db.Exec(col); err != nil && !strings.Contains(err.Error(), "duplicate column") {
			return err
		}
	}

	return nil
}

type UpsertNodeInput struct {
	URL              string
	Path             string
	Title            string
	Description      string
	Depth            int
	PageType         models.PageType
	ParentID         *int64
	HTMLHash         string
	ContentUpdatedAt time.Time
	HTTPLastModified time.Time
	HTTPEtag         string
	ScrapedAt        time.Time
}

func (s *Store) UpsertNode(in UpsertNodeInput) (int64, error) {
	scrapedAt := formatTime(in.ScrapedAt)
	contentUpdatedAt := formatTime(in.ContentUpdatedAt)
	httpLastModified := formatTime(in.HTTPLastModified)

	_, err := s.db.Exec(`
INSERT INTO nodes (
  url, path, title, description, depth, page_type, parent_id,
  html_hash, content_updated_at, http_last_modified, http_etag, scraped_at
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(url) DO UPDATE SET
  title = COALESCE(NULLIF(excluded.title, ''), nodes.title),
  description = CASE
    WHEN length(COALESCE(excluded.description, '')) > length(COALESCE(nodes.description, ''))
    THEN excluded.description
    ELSE nodes.description
  END,
  depth = excluded.depth,
  page_type = excluded.page_type,
  parent_id = COALESCE(excluded.parent_id, nodes.parent_id),
  html_hash = excluded.html_hash,
  content_updated_at = COALESCE(NULLIF(excluded.content_updated_at, ''), nodes.content_updated_at),
  http_last_modified = COALESCE(NULLIF(excluded.http_last_modified, ''), nodes.http_last_modified),
  http_etag = COALESCE(NULLIF(excluded.http_etag, ''), nodes.http_etag),
  scraped_at = excluded.scraped_at
`, in.URL, in.Path, in.Title, in.Description, in.Depth, string(in.PageType), in.ParentID,
		in.HTMLHash, contentUpdatedAt, httpLastModified, in.HTTPEtag, scrapedAt)
	if err != nil {
		return 0, err
	}

	var id int64
	err = s.db.QueryRow(`SELECT id FROM nodes WHERE url = ?`, in.URL).Scan(&id)
	return id, err
}

func (s *Store) UpsertEdge(fromID, toID int64, label string) error {
	_, err := s.db.Exec(`
INSERT INTO edges (from_id, to_id, label) VALUES (?, ?, ?)
ON CONFLICT(from_id, to_id) DO UPDATE SET label = excluded.label
`, fromID, toID, label)
	return err
}

func (s *Store) GetNodeByID(id int64) (*models.Node, error) {
	return s.scanNode(s.db.QueryRow(`
SELECT id, url, path, title, description, depth, page_type, parent_id,
       html_hash, content_updated_at, http_last_modified, http_etag, scraped_at
FROM nodes WHERE id = ?
`, id))
}

func (s *Store) GetNodeByURL(url string) (*models.Node, error) {
	return s.scanNode(s.db.QueryRow(`
SELECT id, url, path, title, description, depth, page_type, parent_id,
       html_hash, content_updated_at, http_last_modified, http_etag, scraped_at
FROM nodes WHERE url = ?
`, url))
}

func (s *Store) scanNode(row *sql.Row) (*models.Node, error) {
	var n models.Node
	var pageType string
	var parentID sql.NullInt64
	var contentUpdatedAt sql.NullString
	var httpLastModified sql.NullString
	var httpEtag sql.NullString
	var scrapedAt sql.NullString

	err := row.Scan(
		&n.ID, &n.URL, &n.Path, &n.Title, &n.Description, &n.Depth, &pageType, &parentID,
		&n.HTMLHash, &contentUpdatedAt, &httpLastModified, &httpEtag, &scrapedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	n.PageType = models.PageType(pageType)
	if parentID.Valid {
		n.ParentID = &parentID.Int64
	}
	n.ContentUpdatedAt = parseTime(contentUpdatedAt)
	n.HTTPLastModified = parseTime(httpLastModified)
	if httpEtag.Valid {
		n.HTTPEtag = httpEtag.String
	}
	n.ScrapedAt = parseTime(scrapedAt)
	return &n, nil
}

func formatTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.UTC().Format(time.RFC3339)
}

func parseTime(v sql.NullString) time.Time {
	if !v.Valid || v.String == "" {
		return time.Time{}
	}
	t, err := time.Parse(time.RFC3339, v.String)
	if err != nil {
		return time.Time{}
	}
	return t
}

func (s *Store) GetNodeIDByURL(url string) (int64, bool, error) {
	var id int64
	err := s.db.QueryRow(`SELECT id FROM nodes WHERE url = ?`, url).Scan(&id)
	if err == sql.ErrNoRows {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	return id, true, nil
}

func (s *Store) StartCrawlRun() (int64, error) {
	res, err := s.db.Exec(`INSERT INTO crawl_runs (started_at, nodes_found, errors) VALUES (?, 0, 0)`, time.Now().UTC().Format(time.RFC3339))
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (s *Store) FinishCrawlRun(runID int64, nodesFound, errors int) error {
	_, err := s.db.Exec(`
UPDATE crawl_runs SET finished_at = ?, nodes_found = ?, errors = ? WHERE id = ?
`, time.Now().UTC().Format(time.RFC3339), nodesFound, errors, runID)
	return err
}

type Stats struct {
	TotalNodes int
	TotalEdges int
	ByType     map[string]int
	MaxDepth   int
}

func (s *Store) Stats() (*Stats, error) {
	stats := &Stats{ByType: make(map[string]int)}

	if err := s.db.QueryRow(`SELECT COUNT(*) FROM nodes`).Scan(&stats.TotalNodes); err != nil {
		return nil, err
	}
	if err := s.db.QueryRow(`SELECT COUNT(*) FROM edges`).Scan(&stats.TotalEdges); err != nil {
		return nil, err
	}
	if err := s.db.QueryRow(`SELECT COALESCE(MAX(depth), 0) FROM nodes`).Scan(&stats.MaxDepth); err != nil {
		return nil, err
	}

	rows, err := s.db.Query(`SELECT page_type, COUNT(*) FROM nodes GROUP BY page_type`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var pageType string
		var count int
		if err := rows.Scan(&pageType, &count); err != nil {
			return nil, err
		}
		stats.ByType[pageType] = count
	}

	return stats, rows.Err()
}

func (s *Store) AllNodes() ([]models.Node, error) {
	rows, err := s.db.Query(`
SELECT id, url, path, title, description, depth, page_type, parent_id,
       html_hash, content_updated_at, http_last_modified, http_etag, scraped_at
FROM nodes ORDER BY depth, path
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var nodes []models.Node
	for rows.Next() {
		var n models.Node
		var pageType string
		var parentID sql.NullInt64
		var contentUpdatedAt sql.NullString
		var httpLastModified sql.NullString
		var httpEtag sql.NullString
		var scrapedAt sql.NullString
		if err := rows.Scan(
			&n.ID, &n.URL, &n.Path, &n.Title, &n.Description, &n.Depth, &pageType, &parentID,
			&n.HTMLHash, &contentUpdatedAt, &httpLastModified, &httpEtag, &scrapedAt,
		); err != nil {
			return nil, err
		}
		n.PageType = models.PageType(pageType)
		if parentID.Valid {
			n.ParentID = &parentID.Int64
		}
		n.ContentUpdatedAt = parseTime(contentUpdatedAt)
		n.HTTPLastModified = parseTime(httpLastModified)
		if httpEtag.Valid {
			n.HTTPEtag = httpEtag.String
		}
		n.ScrapedAt = parseTime(scrapedAt)
		nodes = append(nodes, n)
	}
	return nodes, rows.Err()
}

func (s *Store) AllEdges() ([]models.Edge, error) {
	rows, err := s.db.Query(`SELECT id, from_id, to_id, label FROM edges ORDER BY from_id, to_id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var edges []models.Edge
	for rows.Next() {
		var e models.Edge
		if err := rows.Scan(&e.ID, &e.FromID, &e.ToID, &e.Label); err != nil {
			return nil, err
		}
		edges = append(edges, e)
	}
	return edges, rows.Err()
}

func (s *Store) DB() *sql.DB {
	return s.db
}

func FormatStats(stats *Stats) string {
	out := fmt.Sprintf("Nodes: %d\nEdges: %d\nMax depth: %d\n\nBy page type:\n", stats.TotalNodes, stats.TotalEdges, stats.MaxDepth)
	for pageType, count := range stats.ByType {
		out += fmt.Sprintf("  %s: %d\n", pageType, count)
	}
	return out
}
