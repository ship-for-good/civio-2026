defmodule SQLete.Documents.Pipeline do
  @moduledoc """
  Concrete ingestion pipeline that stores PDFs, persists metadata,
  and enqueues async Arcana ingestion.

  Wires together the storage layer, Oban, and the async ingestion worker
  behind the `SQLete.Documents.IngestionPipeline` behaviour.
  """

  @behaviour SQLete.Documents.IngestionPipeline

  alias SQLete.Documents.Document
  alias SQLete.Documents.DocumentFile
  alias SQLete.Documents.IngestionRequest
  alias SQLete.Documents.ProcessPdfWorker
  alias SQLete.Repo

  @impl true
  def ingest(%IngestionRequest{} = request) do
    with {:ok, storage_key} <- store_pdf(request),
         {:ok, doc_file} <- persist_and_enqueue(request, storage_key) do
      {:ok, to_document(doc_file)}
    end
  end

  defp store_pdf(%IngestionRequest{} = request) do
    storage().store(request.contents,
      filename: request.filename,
      content_type: request.content_type
    )
  end

  defp persist_and_enqueue(%IngestionRequest{} = request, storage_key) do
    case Repo.transaction(fn ->
           with {:ok, doc_file} <- create_document_file(request, storage_key),
                {:ok, _job} <- enqueue_job(doc_file),
                {:ok, queued_doc_file} <- update_status(doc_file, :queued) do
             queued_doc_file
           else
             {:error, reason} -> Repo.rollback(reason)
           end
         end) do
      {:ok, doc_file} ->
        {:ok, doc_file}

      {:error, reason} ->
        _ = storage().delete(storage_key)
        {:error, reason}
    end
  end

  defp create_document_file(%IngestionRequest{} = request, storage_key) do
    %DocumentFile{}
    |> DocumentFile.changeset(%{
      filename: request.filename,
      content_type: request.content_type,
      byte_size: request.byte_size,
      checksum: request.checksum,
      storage_key: storage_key,
      status: :uploaded,
      metadata: request.metadata
    })
    |> Repo.insert()
  end

  defp enqueue_job(%DocumentFile{id: doc_file_id}) do
    %{document_file_id: doc_file_id}
    |> ProcessPdfWorker.new()
    |> Oban.insert()
  end

  defp update_status(%DocumentFile{} = doc_file, status) do
    doc_file
    |> DocumentFile.changeset(%{status: status})
    |> Repo.update()
  end

  defp to_document(%DocumentFile{} = doc_file) do
    %Document{
      id: doc_file.id,
      filename: doc_file.filename,
      content_type: doc_file.content_type,
      byte_size: doc_file.byte_size,
      checksum: doc_file.checksum,
      status: doc_file.status,
      metadata: doc_file.metadata
    }
  end

  defp storage do
    Application.get_env(:sqlete, :storage_module, SQLete.Storage.S3)
  end
end
