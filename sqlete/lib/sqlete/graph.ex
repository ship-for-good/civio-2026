defmodule SQLete.Graph do
  @moduledoc """
  Read-side queries for graph ↔ solicitud cross-references.

  All queries follow the mentions path:
  `entity_mentions → chunks → arcana_documents → document_files`
  since the `arcana_document_id` column on `arcana_graph_entities`
  is not populated by the Arcana library.
  """

  import Ecto.Query

  alias Arcana.Chunk
  alias Arcana.Document
  alias Arcana.Graph.EntityMention
  alias SQLete.Documents.DocumentFile
  alias SQLete.Inbox.GraphEntity, as: GE
  alias SQLete.Repo

  @doc """
  Returns all graph entities mentioned in the document linked to the given solicitud.

  Returns `[%{id: binary, name: String.t(), type: String.t()}]`.
  """
  @spec list_entities_for_solicitud(binary()) :: [map()]
  def list_entities_for_solicitud(solicitud_id) do
    Repo.all(
      from e in GE,
        join: m in EntityMention,
        on: m.entity_id == e.id,
        join: c in Chunk,
        on: c.id == m.chunk_id,
        join: d in Document,
        on: d.id == c.document_id,
        join: df in DocumentFile,
        on: df.arcana_document_id == d.id,
        where: df.id == ^solicitud_id,
        distinct: e.id,
        select: %{id: e.id, name: e.name, type: e.type}
    )
  rescue
    Ecto.Query.CastError -> []
  end

  @doc """
  Returns all solicitudes whose documents mention the given graph entity.

  Returns `[%{id: binary, expediente_id: String.t(), organismo: String.t(), asunto: String.t()}]`.
  """
  @spec list_solicitudes_for_entity(binary()) :: [map()]
  def list_solicitudes_for_entity(entity_id) do
    Repo.all(
      from df in DocumentFile,
        join: d in Document,
        on: d.id == df.arcana_document_id,
        join: c in Chunk,
        on: c.document_id == d.id,
        join: m in EntityMention,
        on: m.chunk_id == c.id,
        where: m.entity_id == ^entity_id,
        distinct: df.id,
        select: %{
          id: df.id,
          expediente_id: df.expediente_id,
          organismo: df.organismo,
          asunto: df.asunto
        }
    )
  end

  @doc """
  Returns a human-readable Spanish label for a graph entity type string.
  """
  @spec type_label(String.t() | nil) :: String.t()
  def type_label(nil), do: "Otro"
  def type_label("person"), do: "Persona"
  def type_label("organization"), do: "Organización"
  def type_label("authority"), do: "Autoridad"
  def type_label("date"), do: "Fecha"
  def type_label("deadline"), do: "Plazo"
  def type_label("jurisdiction_scope"), do: "Ámbito"
  def type_label("file_reference"), do: "Expediente"
  def type_label("information_subject"), do: "Asunto"
  def type_label("requester"), do: "Solicitante"
  def type_label("reclamacion_ref"), do: "Reclamación"
  def type_label("resolution_outcome"), do: "Resolución"
  def type_label("location"), do: "Lugar"
  def type_label("legal_basis"), do: "Base legal"
  def type_label(other), do: other |> String.replace("_", " ") |> String.capitalize()
end
