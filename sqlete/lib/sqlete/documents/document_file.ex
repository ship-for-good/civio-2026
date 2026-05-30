defmodule SQLete.Documents.DocumentFile do
  use Ecto.Schema
  import Ecto.Changeset

  @dataset_fields [
    :source,
    :doc_type,
    :ambito,
    :organismo,
    :asunto,
    :fecha,
    :expediente_id,
    :expediente_padre,
    :reclamacion_ref,
    :resolucion_sentido,
    :pdf_url,
    :local_path,
    :download_status,
    :http_status,
    :size_bytes,
    :notes
  ]

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "document_files" do
    field :source, :string
    field :doc_type, :string
    field :ambito, :string
    field :organismo, :string
    field :asunto, :string
    field :fecha, :date
    field :expediente_id, :string
    field :expediente_padre, :string
    field :reclamacion_ref, :string
    field :resolucion_sentido, :string
    field :pdf_url, :string
    field :local_path, :string
    field :download_status, :string
    field :http_status, :integer
    field :size_bytes, :integer
    field :notes, :string

    # Extracted from the PDF text (FieldExtractor); drive the §7 deadline engine.
    field :inicio_tramitacion, :date
    field :prorroga, :date
    field :resolucion, :date
    field :notificacion, :date
    field :autor, :string

    field :filename, :string
    field :content_type, :string
    field :byte_size, :integer
    field :checksum, :string
    field :storage_key, :string

    field :status, Ecto.Enum,
      values: [:uploaded, :queued, :processing, :completed, :failed],
      default: :uploaded

    field :metadata, :map, default: %{}

    belongs_to :arcana_document, Arcana.Document

    timestamps()
  end

  def dataset_attrs(attrs) when is_map(attrs) do
    Enum.reduce(@dataset_fields, %{}, fn field, acc ->
      case fetch_attr(attrs, field) do
        nil -> acc
        value -> Map.put(acc, field, value)
      end
    end)
  end

  def changeset(struct, attrs) do
    struct
    |> cast(attrs, [
      :source,
      :doc_type,
      :ambito,
      :organismo,
      :asunto,
      :fecha,
      :expediente_id,
      :expediente_padre,
      :reclamacion_ref,
      :resolucion_sentido,
      :pdf_url,
      :local_path,
      :download_status,
      :http_status,
      :size_bytes,
      :notes,
      :inicio_tramitacion,
      :prorroga,
      :resolucion,
      :notificacion,
      :autor,
      :filename,
      :content_type,
      :byte_size,
      :checksum,
      :storage_key,
      :status,
      :metadata,
      :arcana_document_id
    ])
    |> validate_required([:filename, :content_type, :byte_size, :checksum, :storage_key])
  end

  defp fetch_attr(attrs, field) do
    Map.get(attrs, field) || Map.get(attrs, Atom.to_string(field))
  end
end
