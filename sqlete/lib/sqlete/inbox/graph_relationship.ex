defmodule SQLete.Inbox.GraphRelationship do
  use Ecto.Schema

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "arcana_graph_relationships" do
    field :type, :string
    field :description, :string
    field :strength, :integer
    field :metadata, :map, default: %{}
    field :source_id, :binary_id
    field :target_id, :binary_id

    timestamps()
  end
end
