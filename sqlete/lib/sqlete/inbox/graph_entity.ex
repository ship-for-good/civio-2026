defmodule SQLete.Inbox.GraphEntity do
  use Ecto.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "arcana_graph_entities" do
    field :name, :string
    field :type, :string
    field :description, :string
    field :metadata, :map, default: %{}
    field :arcana_document_id, :binary_id
    field :chunk_id, :binary_id
    field :collection_id, :binary_id

    timestamps()
  end
end
