defmodule SQLete.Documents.DocumentFile do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "document_files" do
    field :filename, :string
    field :content_type, :string
    field :byte_size, :integer
    field :checksum, :string
    field :storage_key, :string

    field :status, Ecto.Enum,
      values: [:uploaded, :queued, :processing, :completed, :failed],
      default: :uploaded

    field :metadata, :map, default: %{}

    timestamps()
  end

  def changeset(struct, attrs) do
    struct
    |> cast(attrs, [
      :filename,
      :content_type,
      :byte_size,
      :checksum,
      :storage_key,
      :status,
      :metadata
    ])
    |> validate_required([:filename, :content_type, :byte_size, :checksum, :storage_key])
  end
end
