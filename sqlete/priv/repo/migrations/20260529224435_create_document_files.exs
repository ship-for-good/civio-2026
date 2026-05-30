defmodule SQLete.Repo.Migrations.CreateDocumentFiles do
  use Ecto.Migration

  def change do
    create table(:document_files, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :filename, :string, null: false
      add :content_type, :string, null: false
      add :byte_size, :bigint, null: false
      add :checksum, :string, null: false
      add :storage_key, :string, null: false
      add :status, :string, null: false, default: "uploaded"
      add :metadata, :map, default: %{}

      timestamps()
    end

    create index(:document_files, [:checksum])
    create index(:document_files, [:status])
  end
end
