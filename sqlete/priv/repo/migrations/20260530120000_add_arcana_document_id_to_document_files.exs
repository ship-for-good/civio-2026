defmodule SQLete.Repo.Migrations.AddArcanaDocumentIdToDocumentFiles do
  use Ecto.Migration

  def change do
    alter table(:document_files) do
      add :arcana_document_id,
          references(:arcana_documents, type: :binary_id, on_delete: :nilify_all)
    end

    create index(:document_files, [:arcana_document_id])
  end
end
