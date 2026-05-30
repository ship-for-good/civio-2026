package graph

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/civio/civio-2026/internal/models"
)

func (s *Store) migrateDynamicColumns() error {
	for _, col := range []string{
		`ALTER TABLE nodes ADD COLUMN dynamic_content TEXT`,
		`ALTER TABLE nodes ADD COLUMN dynamic_hash TEXT`,
		`ALTER TABLE nodes ADD COLUMN dynamic_scraped_at TEXT`,
	} {
		if _, err := s.db.Exec(col); err != nil && !strings.Contains(err.Error(), "duplicate column") {
			return err
		}
	}
	return nil
}

type DynamicNodeRow struct {
	ID          int64
	URL         string
	Title       string
	PageType    models.PageType
	DynamicHash string
}

func (s *Store) ListNodesByPageTypes(pageTypes []string, limit int) ([]DynamicNodeRow, error) {
	if err := s.migrateDynamicColumns(); err != nil {
		return nil, err
	}

	placeholders := make([]string, len(pageTypes))
	args := make([]any, len(pageTypes))
	for i, pt := range pageTypes {
		placeholders[i] = "?"
		args[i] = pt
	}

	query := fmt.Sprintf(`
SELECT id, url, title, page_type, COALESCE(dynamic_hash, '')
FROM nodes WHERE page_type IN (%s)
ORDER BY depth, path
`, strings.Join(placeholders, ","))

	if limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", limit)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var nodes []DynamicNodeRow
	for rows.Next() {
		var n DynamicNodeRow
		var pageType string
		if err := rows.Scan(&n.ID, &n.URL, &n.Title, &pageType, &n.DynamicHash); err != nil {
			return nil, err
		}
		n.PageType = models.PageType(pageType)
		nodes = append(nodes, n)
	}
	return nodes, rows.Err()
}

func (s *Store) SaveDynamicContent(nodeID int64, content *models.DynamicContent, hash string) error {
	s.writeMu.Lock()
	defer s.writeMu.Unlock()

	if err := s.migrateDynamicColumns(); err != nil {
		return err
	}

	data, err := json.Marshal(content)
	if err != nil {
		return err
	}

	scrapedAt := content.ScrapedAt
	if scrapedAt == "" {
		scrapedAt = time.Now().UTC().Format(time.RFC3339)
	}

	_, err = s.db.Exec(`
UPDATE nodes SET dynamic_content = ?, dynamic_hash = ?, dynamic_scraped_at = ?
WHERE id = ?
`, string(data), hash, scrapedAt, nodeID)
	return err
}

func parseDynamicContent(raw sql.NullString) *models.DynamicContent {
	if !raw.Valid || raw.String == "" {
		return nil
	}
	var c models.DynamicContent
	if err := json.Unmarshal([]byte(raw.String), &c); err != nil {
		return nil
	}
	return &c
}

func (s *Store) ListTransparenciaLeavesForSede() ([]DynamicNodeRow, error) {
	rows, err := s.db.Query(`
SELECT id, url, title, page_type, COALESCE(dynamic_hash, '')
FROM nodes
WHERE page_type IN ('leaf_static', 'leaf_dynamic')
  AND url LIKE 'https://transparencia.gob.es%'
ORDER BY depth, path
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanDynamicNodeRows(rows)
}

func (s *Store) ListIncompleteSedeNodes() ([]DynamicNodeRow, error) {
	rows, err := s.db.Query(`
SELECT n.id, n.url, n.title, n.page_type, COALESCE(n.dynamic_hash, '')
FROM nodes n
WHERE n.url LIKE 'https://transparencia.sede.gob.es%'
  AND n.page_type = 'navigation'
  AND NOT EXISTS (
    SELECT 1 FROM edges e
    JOIN nodes c ON c.id = e.to_id
    WHERE e.from_id = n.id
      AND (
        instr(lower(c.url), 'formulario') > 0
        OR instr(lower(c.url), 'tramitar') > 0
        OR instr(lower(c.url), 'solicitud') > 0
      )
  )
ORDER BY n.depth, n.path
`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanDynamicNodeRows(rows)
}

func scanDynamicNodeRows(rows *sql.Rows) ([]DynamicNodeRow, error) {
	var nodes []DynamicNodeRow
	for rows.Next() {
		var n DynamicNodeRow
		var pageType string
		if err := rows.Scan(&n.ID, &n.URL, &n.Title, &pageType, &n.DynamicHash); err != nil {
			return nil, err
		}
		n.PageType = models.PageType(pageType)
		nodes = append(nodes, n)
	}
	return nodes, rows.Err()
}
