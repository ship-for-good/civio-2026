defmodule SQLete.DocumentsTest do
  use ExUnit.Case, async: false

  alias SQLete.Documents
  alias SQLete.Documents.Document
  alias SQLete.Documents.IngestionRequest

  defmodule FakePipeline do
    @behaviour SQLete.Documents.IngestionPipeline

    @impl true
    def ingest(%IngestionRequest{} = request) do
      {:ok,
       %Document{
         id: Ecto.UUID.generate(),
         filename: request.filename,
         content_type: request.content_type,
         byte_size: request.byte_size,
         checksum: request.checksum,
         status: :queued,
         metadata: Map.put(request.metadata, :pipeline, :fake)
       }}
    end
  end

  setup do
    previous = Application.get_env(:sqlete, :documents_pipeline)
    Application.put_env(:sqlete, :documents_pipeline, FakePipeline)

    on_exit(fn ->
      if previous do
        Application.put_env(:sqlete, :documents_pipeline, previous)
      else
        Application.delete_env(:sqlete, :documents_pipeline)
      end
    end)

    :ok
  end

  test "ingest_pdf/2 delegates to the configured pipeline" do
    assert {:ok, %Document{} = document} =
             Documents.ingest_pdf("%PDF-1.7 sample", filename: "notice.pdf", source: :test)

    assert document.filename == "notice.pdf"
    assert document.content_type == "application/pdf"
    assert document.byte_size == byte_size("%PDF-1.7 sample")
    assert document.status == :queued
    assert document.metadata.pipeline == :fake
    assert document.metadata.source == :test
  end

  test "ingest_pdf/2 rejects empty binaries" do
    assert {:error, :empty_pdf_binary} = Documents.ingest_pdf("", filename: "empty.pdf")
  end

  test "ingest_pdf/2 rejects unsupported content types" do
    assert {:error, :unsupported_content_type} =
             Documents.ingest_pdf("not empty", filename: "notice.txt", content_type: "text/plain")
  end
end
