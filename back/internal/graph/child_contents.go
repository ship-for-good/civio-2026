package graph

import (
	"encoding/json"
	"fmt"

	"github.com/civio/civio-2026/internal/models"
)

// RefreshChildContents aggregates direct child topics into each parent node's child_contents field.
func RefreshChildContents(store *Store) error {
	rows, err := store.db.Query(`
SELECT e.from_id, n.id, n.title, n.url, n.page_type, n.description
FROM edges e
JOIN nodes n ON n.id = e.to_id
ORDER BY e.from_id, n.title COLLATE NOCASE
`)
	if err != nil {
		return err
	}
	defer rows.Close()

	byParent := make(map[int64][]models.ChildContent)
	for rows.Next() {
		var fromID, childID int64
		var title, url, pageType, description string
		if err := rows.Scan(&fromID, &childID, &title, &url, &pageType, &description); err != nil {
			return err
		}
		pt := models.PageType(pageType)
		byParent[fromID] = append(byParent[fromID], models.ChildContent{
			Title:       title,
			URL:         url,
			PageType:    pageType,
			ContentKind: models.ContentKindLabel(pt),
			Description: description,
		})
	}
	if err := rows.Err(); err != nil {
		return err
	}

	tx, err := store.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`UPDATE nodes SET child_contents = '[]'`); err != nil {
		return err
	}

	stmt, err := tx.Prepare(`UPDATE nodes SET child_contents = ? WHERE id = ?`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for parentID, contents := range byParent {
		data, err := json.Marshal(contents)
		if err != nil {
			return fmt.Errorf("marshal child contents for node %d: %w", parentID, err)
		}
		if _, err := stmt.Exec(string(data), parentID); err != nil {
			return err
		}
	}

	return tx.Commit()
}

func parseChildContents(raw string) []models.ChildContent {
	if raw == "" || raw == "[]" {
		return nil
	}
	var contents []models.ChildContent
	if err := json.Unmarshal([]byte(raw), &contents); err != nil {
		return nil
	}
	return contents
}
