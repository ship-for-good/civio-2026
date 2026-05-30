defmodule SQLete.Repo.Migrations.AddExtractedFieldsToDocumentFiles do
  use Ecto.Migration

  # Fields extracted from the PDF text by SQLete.Documents.FieldExtractor and read
  # directly by the dashboard (deadline engine + autor column). These are the
  # tramitación/resolution dates that drive the §7 plazos.
  def change do
    alter table(:document_files) do
      add :inicio_tramitacion, :date
      add :prorroga, :date
      add :resolucion, :date
      add :notificacion, :date
      add :autor, :string
    end
  end
end
