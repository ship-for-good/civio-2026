defmodule SQLete.Documents.ProcessPdfWorker do
  @moduledoc """
  Stage‑1 Oban worker: parses a PDF and extracts structured fields without any
  LLM‑heavy embedding or graph work.

  Fetches the document file record, retrieves the PDF from storage,
  runs field extraction, stores the parsed text in an arcana document,
  enqueues the LLM processing worker, and broadcasts the fields so the
  dashboard is usable immediately. Status stays `:processing` until the
  LLM worker finishes.
  """

  use Oban.Worker, queue: :pdf_ingestion, max_attempts: 5

  alias SQLete.Documents.DocumentFile
  alias SQLete.Inbox
  alias SQLete.Repo

  @impl true
  def perform(%Oban.Job{args: %{"document_file_id" => doc_file_id}}) do
    with {:ok, doc_file} <- fetch_document(doc_file_id),
         {:ok, processing_doc_file} <- update_status(doc_file, :processing),
         {:ok, pdf_binary} <- fetch_pdf(processing_doc_file),
         {:ok, %{text: text, fields: fields}} <-
           extract_fields(processing_doc_file, pdf_binary),
         {:ok, arcana_doc} <- create_arcana_document(text, processing_doc_file),
         {:ok, _job} <- enqueue_llm_job(processing_doc_file, arcana_doc),
         {:ok, _updated_doc} <- update_fields(processing_doc_file, fields, arcana_doc) do
      Inbox.broadcast({:document_updated, doc_file_id})
      :ok
    else
      {:error, reason} ->
        _ = mark_failed(doc_file_id, reason)

        if reason in [:empty_pdf_text, :no_fields_extracted, :missing_api_key] do
          {:cancel, reason}
        else
          {:error, reason}
        end
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

  defp update_status(%DocumentFile{} = doc_file, status, attrs \\ %{}) do
    attrs = Map.put(attrs, :status, status)

    doc_file
    |> DocumentFile.changeset(attrs)
    |> Repo.update()
  end

  defp fetch_pdf(%DocumentFile{storage_key: storage_key}) do
    storage().get(storage_key)
  end

  defp extract_fields(%DocumentFile{} = doc_file, pdf_binary) do
    ingestor().extract_fields(pdf_binary, doc_file)
  end

  defp create_arcana_document(text, %DocumentFile{} = doc_file) do
    ingestor().create_arcana_document(text, doc_file)
  end

  defp enqueue_llm_job(%DocumentFile{id: doc_file_id}, %{id: arcana_doc_id}) do
    %{document_file_id: doc_file_id, arcana_document_id: arcana_doc_id}
    |> SQLete.Documents.LlmProcessingWorker.new()
    |> Oban.insert()
  end

  defp update_fields(%DocumentFile{} = doc_file, fields, arcana_doc) do
    metadata = Map.put(doc_file.metadata || %{}, "arcana_stage", "fields_extracted")
    attrs = Map.merge(fields, %{metadata: metadata, arcana_document_id: arcana_doc.id})

    doc_file
    |> DocumentFile.changeset(attrs)
    |> Repo.update()
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
