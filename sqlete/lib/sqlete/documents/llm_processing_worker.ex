defmodule SQLete.Documents.LlmProcessingWorker do
  @moduledoc """
  Stage‑2 Oban worker: runs LLM‑heavy embedding and graph extraction.

  Loads the arcana document created by `ProcessPdfWorker`, chunks the text,
  generates vector embeddings, builds the knowledge graph, and finalises
  the document record.  The status is set to `:completed` once done.
  """

  use Oban.Worker, queue: :llm_processing, max_attempts: 5

  alias SQLete.Documents.DocumentFile
  alias SQLete.Inbox
  alias SQLete.Repo

  @impl true
  def perform(%Oban.Job{
        args: %{"document_file_id" => doc_file_id, "arcana_document_id" => arcana_doc_id}
      }) do
    with {:ok, doc_file} <- fetch_document(doc_file_id),
         {:ok, arcana_doc} <- fetch_arcana_document(arcana_doc_id),
         {:ok, arcana_summary} <- process_graph(arcana_doc, doc_file),
         {:ok, _completed_doc} <- mark_completed(doc_file, arcana_summary) do
      Inbox.broadcast({:document_updated, doc_file_id})
      :ok
    else
      {:error, reason} ->
        _ = mark_failed(doc_file_id, reason)
        {:error, reason}
    end
  rescue
    error ->
      _ = mark_failed(doc_file_id, error)
      {:error, Exception.message(error)}
  end

  defp fetch_document(id) do
    case Repo.get(DocumentFile, id) do
      nil -> {:error, :not_found}
      doc_file -> {:ok, doc_file}
    end
  end

  defp fetch_arcana_document(id) do
    case Repo.get(Arcana.Document, id) do
      nil -> {:error, :arcana_document_not_found}
      doc -> {:ok, doc}
    end
  end

  defp process_graph(arcana_doc, %DocumentFile{} = doc_file) do
    ingestor().process_graph(arcana_doc, doc_file)
  end

  defp mark_completed(%DocumentFile{} = doc_file, arcana_summary) do
    metadata = Map.put(doc_file.metadata || %{}, "arcana", arcana_summary)

    doc_file
    |> DocumentFile.changeset(%{status: :completed, metadata: metadata})
    |> Repo.update()
  end

  defp mark_failed(doc_file_id, reason) when is_binary(doc_file_id) do
    case Repo.get(DocumentFile, doc_file_id) do
      nil ->
        :ok

      doc_file ->
        metadata =
          (doc_file.metadata || %{})
          |> Map.put("llm_processing_error", inspect(reason))
          |> Map.put("arcana_stage", "llm_failed")

        doc_file
        |> DocumentFile.changeset(%{status: :failed, metadata: metadata})
        |> Repo.update()
    end
  end

  defp mark_failed(nil, _reason), do: :ok

  defp ingestor do
    Application.get_env(:sqlete, :documents_ingestor, SQLete.Documents.ArcanaIngestor)
  end
end
