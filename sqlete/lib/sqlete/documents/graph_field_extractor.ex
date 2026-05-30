defmodule SQLete.Documents.GraphFieldExtractor do
  @moduledoc """
  Extracts solicitud-related fields from the Arcana knowledge graph.

  After a document is ingested and its graph entities are persisted, this
  module walks the entities and relationships to populate `document_files`
  columns (ambito, organismo, asunto, etc.) so the inbox does not need to
  recompute them from the graph on every read.
  """

  import Ecto.Query

  alias SQLete.Documents.DocumentFile
  alias SQLete.Inbox.EctoSource
  alias SQLete.Inbox.GraphEntity, as: GE
  alias SQLete.Inbox.GraphRelationship, as: GR
  alias SQLete.Repo

  @doc """
  Returns a map of `DocumentFile`-compatible attributes extracted from the
  graph entities linked to the given document file.

  Only fields that could be extracted are present in the returned map;
  missing fields are omitted so callers can safely merge it into existing
  attributes without overwriting known values with `nil`.
  """
  @spec extract_fields(DocumentFile.t()) :: map()
  def extract_fields(%DocumentFile{arcana_document_id: nil}), do: %{}

  def extract_fields(%DocumentFile{arcana_document_id: doc_id}) do
    entities = load_entities(doc_id)
    relationships = load_relationships(Enum.map(entities, & &1.id))

    graph = %{
      entities: entities,
      rels_by_source: Enum.group_by(relationships, & &1.source_id),
      rels_by_target: Enum.group_by(relationships, & &1.target_id)
    }

    %{}
    |> put_field(:external_id, extract_external_id(graph))
    |> put_field(:ambito, extract_ambito(graph))
    |> put_field(:organismo, extract_organismo(graph))
    |> put_field(:asunto, extract_asunto(graph))
    |> put_field(:autor, extract_autor(graph))
    |> put_field(:reclamacion_ref, extract_reclamacion_ref(graph))
    |> put_field(:resolucion_sentido, extract_resolucion_sentido(graph))
    |> put_field(:fecha, extract_fecha(graph))
  end

  defp put_field(map, _key, nil), do: map
  defp put_field(map, _key, ""), do: map
  defp put_field(map, key, value), do: Map.put(map, key, value)

  defp load_entities(doc_id) do
    GE
    |> where([e], e.arcana_document_id == ^doc_id)
    |> Repo.all()
  end

  defp load_relationships([]), do: []

  defp load_relationships(entity_ids) do
    GR
    |> where([r], r.source_id in ^entity_ids or r.target_id in ^entity_ids)
    |> Repo.all()
  end

  defp extract_external_id(graph) do
    find_target_name(graph, "REFERENCES_FILE", "file_reference")
  end

  defp extract_ambito(graph) do
    find_target_metadata(graph, "HAS_JURISDICTION", "jurisdiction_scope", "normalized_value")
  end

  defp extract_organismo(graph) do
    find_target_name(graph, "ADDRESSED_TO", "authority") ||
      find_target_name(graph, "ISSUED_BY", "authority")
  end

  defp extract_asunto(graph) do
    find_target_name(graph, "ABOUT_SUBJECT", "information_subject")
  end

  defp extract_autor(graph) do
    find_target_name(graph, "FILED_BY", "requester")
  end

  defp extract_reclamacion_ref(graph) do
    find_target_name(graph, "REFERENCES_RECLAMACION", "reclamacion_ref")
  end

  defp extract_resolucion_sentido(graph) do
    find_target_metadata(graph, "HAS_OUTCOME", "resolution_outcome", "normalized_value")
  end

  defp extract_fecha(graph) do
    date_entities = Enum.filter(graph.entities, &(&1.type in ["date", "deadline"]))

    find_date_by_kind(date_entities, "filing_date") ||
      find_date_by_kind(date_entities, "notification_date")
  end

  defp find_target_name(graph, _rel_type, entity_type) do
    case Enum.find(graph.entities, &(&1.type == entity_type)) do
      nil -> nil
      entity -> entity.name
    end
  end

  defp find_target_metadata(graph, _rel_type, entity_type, metadata_key) do
    case Enum.find(graph.entities, &(&1.type == entity_type)) do
      nil ->
        nil

      entity ->
        metadata = entity.metadata || %{}
        Map.get(metadata, metadata_key) || Map.get(metadata, String.to_atom(metadata_key))
    end
  end

  defp find_date_by_kind(date_entities, kind) do
    case Enum.find(date_entities, fn e ->
           meta = e.metadata || %{}
           Map.get(meta, "kind") == kind or Map.get(meta, :kind) == kind
         end) do
      nil -> nil
      entity -> EctoSource.parse_date(entity.name)
    end
  end
end
