defmodule SQLete.Documents.ArcanaIngestor do
  @moduledoc """
  Application-owned adapter for Arcana-backed PDF ingestion.

  It uses Arcana's configured PDF parser to extract text, then delegates to
  `Arcana.ingest/2` so vector storage and optional GraphRAG stay within Arcana.
  """

  @behaviour SQLete.Documents.Ingestor

  alias SQLete.Documents.DocumentFile
  alias SQLete.Repo

  @impl true
  def ingest_pdf(pdf_binary, %DocumentFile{} = doc_file) when is_binary(pdf_binary) do
    with {:ok, text} <- parse_pdf(pdf_binary, doc_file),
         {:ok, arcana_document} <- Arcana.ingest(text, arcana_opts(doc_file)) do
      {:ok,
       %{
         "provider" => "arcana",
         "status" => "completed",
         "document_id" => arcana_document.id,
         "source_id" => source_id(doc_file),
         "collection" => collection(doc_file),
         "graph_enabled" => graph_enabled?(doc_file),
         "chunk_count" => arcana_document.chunk_count,
         "completed_at" => timestamp()
       }}
    end
  end

  defp parse_pdf(pdf_binary, %DocumentFile{} = doc_file) do
    parser = Arcana.Config.pdf_parser()

    if Arcana.FileParser.PDF.supports_binary?(parser) do
      Arcana.FileParser.PDF.parse(parser, pdf_binary)
    else
      parse_pdf_via_tempfile(parser, pdf_binary, doc_file)
    end
  end

  defp parse_pdf_via_tempfile(parser, pdf_binary, %DocumentFile{} = doc_file) do
    path = temp_pdf_path(doc_file)

    case File.write(path, pdf_binary, [:binary]) do
      :ok ->
        try do
          Arcana.FileParser.PDF.parse(parser, path)
        after
          File.rm(path)
        end

      {:error, reason} ->
        {:error, normalize_tempfile_error(reason)}
    end
  end

  defp arcana_opts(%DocumentFile{} = doc_file) do
    [
      repo: Repo,
      source_id: source_id(doc_file),
      collection: collection(doc_file),
      metadata: arcana_metadata(doc_file),
      graph: graph_enabled?(doc_file)
    ]
  end

  defp arcana_metadata(%DocumentFile{} = doc_file) do
    (doc_file.metadata || %{})
    |> put_default_metadata("document_file_id", doc_file.id)
    |> put_default_metadata("filename", doc_file.filename)
    |> put_default_metadata("content_type", doc_file.content_type)
    |> put_default_metadata("storage_key", doc_file.storage_key)
    |> put_default_metadata("checksum", doc_file.checksum)
    |> put_default_metadata("byte_size", doc_file.byte_size)
  end

  defp put_default_metadata(metadata, key, value) do
    Map.put_new(metadata, key, value)
  end

  defp source_id(%DocumentFile{} = doc_file) do
    metadata_value(doc_file, "source_id") || metadata_value(doc_file, "source") || doc_file.id
  end

  defp collection(%DocumentFile{} = doc_file) do
    metadata_value(doc_file, "collection") ||
      Application.get_env(:sqlete, :documents_arcana_collection, "documents")
  end

  defp graph_enabled?(%DocumentFile{} = doc_file) do
    case metadata_value(doc_file, "graph") do
      nil -> Application.get_env(:sqlete, :documents_arcana_graph, true)
      value -> truthy?(value)
    end
  end

  defp metadata_value(%DocumentFile{metadata: metadata}, key) do
    metadata = metadata || %{}

    case key do
      "source_id" -> Map.get(metadata, "source_id") || Map.get(metadata, :source_id)
      "source" -> Map.get(metadata, "source") || Map.get(metadata, :source)
      "collection" -> Map.get(metadata, "collection") || Map.get(metadata, :collection)
      "graph" -> Map.get(metadata, "graph") || Map.get(metadata, :graph)
    end
  end

  defp truthy?(value) when is_boolean(value), do: value
  defp truthy?(value) when is_integer(value), do: value != 0

  defp truthy?(value) when is_binary(value) do
    String.downcase(value) in ["1", "true", "yes", "on"]
  end

  defp truthy?(_value), do: false

  defp temp_pdf_path(%DocumentFile{id: id, filename: filename}) do
    unique = System.unique_integer([:positive])
    sanitized_name = filename |> Path.basename() |> String.replace(~r/[^A-Za-z0-9._-]+/, "-")
    Path.join(System.tmp_dir!(), "sqlete-#{id}-#{unique}-#{sanitized_name}")
  end

  defp normalize_tempfile_error(reason) when is_atom(reason), do: {:tempfile_failed, reason}
  defp normalize_tempfile_error(reason), do: reason

  defp timestamp do
    DateTime.utc_now()
    |> DateTime.truncate(:second)
    |> DateTime.to_iso8601()
  end
end