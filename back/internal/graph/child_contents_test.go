package graph

import (
	"database/sql"
	"testing"

	"github.com/civio/civio-2026/internal/models"
)

func TestRefreshChildContents(t *testing.T) {
	store, err := Open(t.TempDir() + "/test.db")
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()

	parentID, err := store.UpsertNode(UpsertNodeInput{
		URL:      "https://transparencia.gob.es/publicidad-activa/por-materias",
		Path:     "/publicidad-activa/por-materias",
		Title:    "Materias",
		PageType: models.PageTypeNavigation,
	})
	if err != nil {
		t.Fatal(err)
	}

	child1ID, err := store.UpsertNode(UpsertNodeInput{
		URL:         "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo",
		Path:        "/publicidad-activa/por-materias/organizacion-empleo",
		Title:       "Organización y Empleo",
		Description: "Materia organizativa",
		PageType:    models.PageTypeNavigation,
	})
	if err != nil {
		t.Fatal(err)
	}

	child2ID, err := store.UpsertNode(UpsertNodeInput{
		URL:      "https://transparencia.gob.es/publicidad-activa/por-materias/contratos",
		Path:     "/publicidad-activa/por-materias/contratos",
		Title:    "Contratos",
		PageType: models.PageTypeBuscadorEntry,
	})
	if err != nil {
		t.Fatal(err)
	}

	if err := store.UpsertEdge(parentID, child1ID, "Organización y Empleo"); err != nil {
		t.Fatal(err)
	}
	if err := store.UpsertEdge(parentID, child2ID, "Contratos"); err != nil {
		t.Fatal(err)
	}

	if err := RefreshChildContents(store); err != nil {
		t.Fatal(err)
	}

	parent, err := store.GetNodeByID(parentID)
	if err != nil || parent == nil {
		t.Fatal("parent not found")
	}
	if len(parent.ChildContents) != 2 {
		t.Fatalf("child contents = %d, want 2", len(parent.ChildContents))
	}

	byTitle := make(map[string]models.ChildContent)
	for _, c := range parent.ChildContents {
		byTitle[c.Title] = c
	}

	org, ok := byTitle["Organización y Empleo"]
	if !ok || org.ContentKind != "índice de secciones" {
		t.Fatalf("unexpected org content: %+v", org)
	}
	contratos, ok := byTitle["Contratos"]
	if !ok || contratos.PageType != "buscador_entry" {
		t.Fatalf("unexpected contratos content: %+v", contratos)
	}

	var raw sql.NullString
	if err := store.db.QueryRow(`SELECT child_contents FROM nodes WHERE id = ?`, parentID).Scan(&raw); err != nil {
		t.Fatal(err)
	}
	if !raw.Valid || raw.String == "" {
		t.Fatal("expected child_contents JSON in database")
	}
}
