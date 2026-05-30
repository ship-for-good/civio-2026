defmodule SQLete.Documents.ArcanaIngestor do
  @moduledoc """
  Application-owned adapter for Arcana-backed PDF ingestion.

  Implements a custom parallel pipeline that batch-embeds chunks in a single
  API call and runs graph extraction with higher concurrency, instead of relying
  on `Arcana.ingest/2` which processes chunks sequentially.
  """

  @behaviour SQLete.Documents.Ingestor

  alias Arcana.Chunk, as: ArcanaChunk
  alias Arcana.Collection, as: ArcanaCollection
  alias Arcana.Document, as: ArcanaDocument

  require Logger

  alias SQLete.Documents.DocumentFile
  alias SQLete.Documents.FieldExtractor
  alias SQLete.Repo

  @graph_concurrency 10
  @embed_batch_size 100

  @impl true
  def ingest_pdf(pdf_binary, %DocumentFile{} = doc_file) when is_binary(pdf_binary) do
    # Structured field extraction is the priority (it feeds the dashboard). If it
    # fails we surface the error so the worker can retry (transient) or cancel
    # (no text / nothing extracted) — never persist an empty solicitud silently.
    # Arcana embeddings are best-effort and never block this.
    with {:ok, text} <- parse(pdf_binary, doc_file),
         :ok <- ensure_text(text, doc_file),
         {:ok, fields} <- FieldExtractor.extract(text),
         :ok <- ensure_fields(fields, doc_file) do
      summary = embeddings_summary(text, doc_file)
      {:ok, Map.put(summary, "fields", fields)}
    end
  end

  @impl true
  def extract_fields(pdf_binary, %DocumentFile{} = doc_file) when is_binary(pdf_binary) do
    with {:ok, text} <- parse(pdf_binary, doc_file),
         :ok <- ensure_text(text, doc_file),
         {:ok, fields} <- FieldExtractor.extract(text),
         :ok <- ensure_fields(fields, doc_file) do
      {:ok, %{text: text, fields: fields}}
    end
  end

  @impl true
  def create_arcana_document(text, %DocumentFile{} = doc_file) when is_binary(text) do
    with {:ok, collection} <- ArcanaCollection.get_or_create(collection(doc_file), Repo) do
      %ArcanaDocument{}
      |> ArcanaDocument.changeset(%{
        content: text,
        source_id: source_id(doc_file),
        metadata: arcana_metadata(doc_file),
        status: :processing,
        collection_id: collection.id
      })
      |> Repo.insert()
    end
  end

  @impl true
  def process_graph(%Arcana.Document{} = arcana_doc, %DocumentFile{} = doc_file) do
    if embeddings_enabled?() do
      do_process_graph(arcana_doc, doc_file)
    else
      {:ok, skipped_summary(doc_file, "disabled")}
    end
  rescue
    error ->
      Logger.warning("Arcana process_graph crashed for #{doc_file.id}: #{inspect(error)}")
      {:ok, skipped_summary(doc_file, inspect(error))}
  end

  defp do_process_graph(%Arcana.Document{} = arcana_doc, %DocumentFile{} = doc_file) do
    collection = Repo.preload(arcana_doc, :collection).collection
    text = arcana_doc.content

    with {:ok, chunk_records} <- chunk_embed_and_store(text, arcana_doc),
         :ok <- maybe_build_graph(chunk_records, collection, doc_file),
         {:ok, document} <- finalize_document(arcana_doc, chunk_records) do
      {:ok, build_summary(document, doc_file)}
    else
      {:error, reason} -> {:ok, skipped_summary(doc_file, inspect(reason))}
    end
  end

  defp ensure_text(text, %DocumentFile{} = doc_file) do
    if String.trim(text) == "" do
      Logger.warning("No text layer for #{doc_file.id} (scanned PDF?)")
      {:error, :empty_pdf_text}
    else
      :ok
    end
  end

  defp ensure_fields(fields, %DocumentFile{} = doc_file) do
    if map_size(fields) >= 2 do
      :ok
    else
      Logger.warning("Extraction yielded no usable fields for #{doc_file.id}")
      {:error, :no_fields_extracted}
    end
  end

  defp embeddings_summary(text, %DocumentFile{} = doc_file) do
    if embeddings_enabled?() do
      run_embeddings(text, doc_file)
    else
      skipped_summary(doc_file, "disabled")
    end
  end

  # Best-effort: embeddings must never block the structured fields. Catch both
  # {:error, _} returns and raised exceptions (e.g. arcana_collections races).
  defp run_embeddings(text, %DocumentFile{} = doc_file) do
    case ingest_text(text, doc_file) do
      {:ok, summary} -> summary
      {:error, reason} -> skipped_summary(doc_file, inspect(reason))
    end
  rescue
    error ->
      Logger.warning("Arcana embeddings crashed for #{doc_file.id}: #{inspect(error)}")
      skipped_summary(doc_file, inspect(error))
  end

  defp skipped_summary(%DocumentFile{} = doc_file, reason) do
    %{
      "provider" => "arcana",
      "status" => "skipped",
      "graph_enabled" => graph_enabled?(doc_file),
      "reason" => reason,
      "completed_at" => timestamp()
    }
  end

  defp embeddings_enabled? do
    Application.get_env(:sqlete, :documents_arcana_embeddings, false)
  end

  @doc "Parse a PDF binary into plain text using Arcana's configured parser."
  @spec parse(binary(), DocumentFile.t()) :: {:ok, String.t()} | {:error, term()}
  def parse(pdf_binary, %DocumentFile{} = doc_file) when is_binary(pdf_binary) do
    parse_pdf(pdf_binary, doc_file)
  end

  @doc "Run Arcana ingestion (chunking + embeddings, optional graph) over text."
  @spec ingest_text(String.t(), DocumentFile.t()) :: {:ok, map()} | {:error, term()}
  def ingest_text(text, %DocumentFile{} = doc_file) when is_binary(text) do
    with {:ok, collection} <- ArcanaCollection.get_or_create(collection(doc_file), Repo),
         {:ok, document} <- create_document(text, collection, doc_file),
         {:ok, chunk_records} <- chunk_embed_and_store(text, document),
         :ok <- maybe_build_graph(chunk_records, collection, doc_file),
         {:ok, document} <- finalize_document(document, chunk_records) do
      {:ok, build_summary(document, doc_file)}
    end
  end

  defp chunk_embed_and_store(text, document) do
    chunker_config = Arcana.Config.resolve_chunker([])
    chunks = Arcana.Chunker.chunk(chunker_config, text, [])

    if chunks == [] do
      {:ok, []}
    else
      embed_and_store_chunks(chunks, document)
    end
  end

  defp embed_and_store_chunks(chunks, document) do
    embedder = Arcana.Config.embedder()
    texts = Enum.map(chunks, & &1.text)

    batches = Enum.chunk_every(texts, @embed_batch_size)

    case embed_batches(embedder, batches) do
      {:ok, all_embeddings} ->
        chunk_records =
          chunks
          |> Enum.zip(all_embeddings)
          |> Enum.map(fn {chunk, embedding} ->
            %ArcanaChunk{}
            |> ArcanaChunk.changeset(%{
              text: chunk.text,
              embedding: embedding,
              chunk_index: chunk.chunk_index,
              token_count: chunk.token_count,
              document_id: document.id
            })
            |> Repo.insert!()
          end)

        {:ok, chunk_records}

      {:error, reason} ->
        {:error, {:embedding_failed, reason}}
    end
  end

  defp embed_batches(embedder, batches) do
    results =
      Enum.map(batches, fn batch ->
        Arcana.Embedder.embed_batch(embedder, batch)
      end)

    case Enum.split_with(results, &match?({:ok, _}, &1)) do
      {ok_results, []} ->
        all_embeddings = Enum.flat_map(ok_results, fn {:ok, embs} -> embs end)
        {:ok, all_embeddings}

      {_ok_results, errors} ->
        {:error, errors}
    end
  end

  defp maybe_build_graph(chunk_records, collection, doc_file) do
    if graph_enabled?(doc_file) and chunk_records != [] do
      opts = [graph: true, concurrency: @graph_concurrency]
      Arcana.Graph.build_and_persist(chunk_records, collection, Repo, opts)
      :ok
    else
      :ok
    end
  end

  defp create_document(text, collection, doc_file) do
    %ArcanaDocument{}
    |> ArcanaDocument.changeset(%{
      content: text,
      source_id: source_id(doc_file),
      metadata: arcana_metadata(doc_file),
      status: :processing,
      collection_id: collection.id
    })
    |> Repo.insert()
  end

  defp finalize_document(document, chunk_records) do
    document
    |> ArcanaDocument.changeset(%{status: :completed, chunk_count: length(chunk_records)})
    |> Repo.update()
  end

  defp build_summary(document, doc_file) do
    %{
      "provider" => "arcana",
      "status" => "completed",
      "document_id" => document.id,
      "source_id" => source_id(doc_file),
      "collection" => collection(doc_file),
      "graph_enabled" => graph_enabled?(doc_file),
      "chunk_count" => document.chunk_count,
      "completed_at" => timestamp()
    }
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
