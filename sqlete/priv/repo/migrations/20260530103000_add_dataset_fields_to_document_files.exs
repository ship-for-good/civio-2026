defmodule SQLete.Repo.Migrations.AddDatasetFieldsToDocumentFiles do
  use Ecto.Migration

  def change do
    alter table(:document_files) do
      add :source, :string
      add :doc_type, :string
      add :ambito, :string
      add :organismo, :string
      add :asunto, :text
      add :fecha, :date
      add :expediente_id, :string
      add :reclamacion_ref, :string
      add :resolucion_sentido, :string
      add :pdf_url, :text
      add :local_path, :text
      add :download_status, :string
      add :http_status, :integer
      add :size_bytes, :bigint
      add :notes, :text
    end
  end
end
