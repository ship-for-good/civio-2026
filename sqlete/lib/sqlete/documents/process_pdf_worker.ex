defmodule SQLete.Documents.ProcessPdfWorker do
  @moduledoc """
  Oban worker that processes a stored PDF through the Arcana ingestion pipeline.

  Fetches the document file record, retrieves the PDF from storage,
  runs the configured ingestor, and persists the results.
  """

  use Oban.Worker, queue: :pdf_ingestion

  alias SQLete.Documents.DocumentFile
  alias SQLete.Repo

  @impl true
  def perform(%Oban.Job{args: %{"document_file_id" => doc_file_id}}) do
    with {:ok, doc_file} <- fetch_document(doc_file_id),
         {:ok, processing_doc_file} <- update_status(doc_file, :processing),
         {:ok, pdf_binary} <- fetch_pdf(processing_doc_file),
         {:ok, ingest_summary} <- ingest_pdf(processing_doc_file, pdf_binary),
         {:ok, _completed_doc_file} <- mark_completed(processing_doc_file, ingest_summary) do
      :ok
    else
      {:error, reason} ->
        _ = mark_failed(doc_file_id, reason)
        {:error, reason}
    end
  end

  defp fetch_document(id) do
    case Repo.get(DocumentFile, id) do
      nil -> {:error, :not_found}
      doc_file -> {:ok, doc_file}
    end
  end

  defp update_status(%DocumentFile{} = doc_file, status, attrs \\ %{}) do
    attrs = Map.put(attrs, :status, status)

    doc_file
    |> DocumentFile.changeset(attrs)
    |> Repo.update()
  end

  defp fetch_pdf(%DocumentFile{storage_key: storage_key}) do
    storage().get(storage_key)
  end

  defp ingest_pdf(%DocumentFile{} = doc_file, pdf_binary) do
    ingestor().ingest_pdf(pdf_binary, doc_file)
  end

  defp mark_completed(%DocumentFile{} = doc_file, ingest_summary) when is_map(ingest_summary) do
    metadata = Map.put(doc_file.metadata || %{}, "arcana", ingest_summary)

    update_status(doc_file, :completed, %{metadata: metadata})
  end

  defp mark_failed(doc_file_id, reason) when is_binary(doc_file_id) do
    case Repo.get(DocumentFile, doc_file_id) do
      nil ->
        :ok

      doc_file ->
        metadata =
          (doc_file.metadata || %{})
          |> Map.put("processing_error", inspect(reason))
          |> Map.put("arcana", %{
            "provider" => "arcana",
            "status" => "failed",
            "failed_at" => timestamp(),
            "error" => inspect(reason)
          })

        update_status(doc_file, :failed, %{metadata: metadata})
    end
  end

  defp mark_failed(nil, _reason), do: :ok

  defp ingestor do
    Application.get_env(:sqlete, :documents_ingestor, SQLete.Documents.ArcanaIngestor)
  end

  defp timestamp do
    DateTime.utc_now()
    |> DateTime.truncate(:second)
    |> DateTime.to_iso8601()
  end

  defp storage do
    Application.get_env(:sqlete, :storage_module, SQLete.Storage.S3)
  end
end
