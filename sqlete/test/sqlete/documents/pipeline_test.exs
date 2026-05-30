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
             Documents.ingest_pdf(pdf_binary,
               filename: "notice.pdf",
               source: "ctbg",
               doc_type: "resolucion_estimatoria",
               ambito: "AGE",
               organismo: "Consejo de Transparencia y Buen Gobierno",
               asunto: "Acceso a expediente de contratación",
               fecha: ~D[2026-05-30],
               expediente_id: "EXP-2026-001",
               reclamacion_ref: "R-001-2026",
               resolucion_sentido: "estimatoria",
               pdf_url: "https://example.test/resolucion.pdf",
               local_path: "dataset-notificaciones/pdfs/resolucion.pdf",
               download_status: "ok",
               http_status: 200,
               size_bytes: 123_456,
               notes: "imported from dataset"
             )

    assert document.status == :queued

    doc_file = Repo.get!(DocumentFile, document.id)
    assert doc_file.filename == "notice.pdf"
    assert doc_file.status == :queued
    assert doc_file.source == "ctbg"
    assert doc_file.doc_type == "resolucion_estimatoria"
    assert doc_file.ambito == "AGE"
    assert doc_file.organismo == "Consejo de Transparencia y Buen Gobierno"
    assert doc_file.asunto == "Acceso a expediente de contratación"
    assert doc_file.fecha == ~D[2026-05-30]
    assert doc_file.expediente_id == "EXP-2026-001"
    assert doc_file.reclamacion_ref == "R-001-2026"
    assert doc_file.resolucion_sentido == "estimatoria"
    assert doc_file.pdf_url == "https://example.test/resolucion.pdf"
    assert doc_file.local_path == "dataset-notificaciones/pdfs/resolucion.pdf"
    assert doc_file.download_status == "ok"
    assert doc_file.http_status == 200
    assert doc_file.size_bytes == 123_456
    assert doc_file.notes == "imported from dataset"
    assert doc_file.metadata["source"] == "ctbg"

    assert {:ok, ^pdf_binary} = Fake.get(doc_file.storage_key)

    [job] = Repo.all(from(job in Oban.Job))

    assert job.queue == "pdf_ingestion"
    assert String.ends_with?(job.worker, "SQLete.Documents.ProcessPdfWorker")
    assert job.args["document_file_id"] == doc_file.id
    refute Map.has_key?(job.args, "extractor")
  end

  test "delete_document/1 removes the row and the stored pdf" do
    assert {:ok, document} = Documents.ingest_pdf("%PDF-1.7 sample", filename: "notice.pdf")
    doc_file = Repo.get!(DocumentFile, document.id)
    assert {:ok, _bytes} = Fake.get(doc_file.storage_key)

    assert {:ok, %DocumentFile{}} = Documents.delete_document(document.id)

    refute Repo.get(DocumentFile, document.id)
    assert {:error, :not_found} = Fake.get(doc_file.storage_key)
  end

  test "delete_document/1 returns :not_found for an unknown id" do
    assert {:error, :not_found} = Documents.delete_document(Ecto.UUID.generate())
  end
end
