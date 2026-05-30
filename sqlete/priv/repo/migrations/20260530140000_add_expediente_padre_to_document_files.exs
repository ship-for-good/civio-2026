defmodule SQLete.Repo.Migrations.AddExpedientePadreToDocumentFiles do
  use Ecto.Migration

  # Direct (column-based) redistribution detection: links a child expediente to
  # the matriz solicitud it was split from, so EctoSource can group "1 → N"
  # without depending on the knowledge graph.
  def change do
    alter table(:document_files) do
      add :expediente_padre, :string
    end
  end
end
