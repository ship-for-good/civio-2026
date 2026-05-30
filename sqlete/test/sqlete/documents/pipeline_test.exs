defmodule SQLete.Documents.PipelineTest do
  use SQLete.DataCase, async: false

  import Ecto.Query

  alias SQLete.Documents
  alias SQLete.Documents.DocumentFile
  alias SQLete.Storage.Fake

  setup do
    previous_storage = Application.get_env(:sqlete, :storage_module)
    previous_pipeline = Application.get_env(:sqlete, :documents_pipeline)

    Application.put_env(:sqlete, :storage_module, Fake)
    Application.put_env(:sqlete, :documents_pipeline, SQLete.Documents.Pipeline)
    Fake.reset()

    on_exit(fn ->
      Application.put_env(:sqlete, :storage_module, previous_storage)
      Application.put_env(:sqlete, :documents_pipeline, previous_pipeline)
      Fake.reset()
    end)

    :ok
  end

  test "ingest_pdf/2 stores the pdf, persists metadata, and enqueues processing" do
    pdf_binary = "%PDF-1.7 sample"

    assert {:ok, document} =
             Documents.ingest_pdf(pdf_binary, filename: "notice.pdf", source: "pipeline-test")

    assert document.status == :queued

    doc_file = Repo.get!(DocumentFile, document.id)
    assert doc_file.filename == "notice.pdf"
    assert doc_file.status == :queued
    assert doc_file.metadata["source"] == "pipeline-test"

    assert {:ok, ^pdf_binary} = Fake.get(doc_file.storage_key)

    [job] = Repo.all(from job in Oban.Job)

    assert job.queue == "pdf_ingestion"
    assert String.ends_with?(job.worker, "SQLete.Documents.ProcessPdfWorker")
    assert job.args["document_file_id"] == doc_file.id
    refute Map.has_key?(job.args, "extractor")
  end
end
