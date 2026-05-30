defmodule SQLete.Documents.ProcessPdfWorkerTest do
  use SQLete.DataCase, async: false

  import Ecto.Query

  alias SQLete.Documents.DocumentFile
  alias SQLete.Documents.ProcessPdfWorker
  alias SQLete.Storage.Fake

  setup do
    previous_storage = Application.get_env(:sqlete, :storage_module)
    Application.put_env(:sqlete, :storage_module, Fake)
    Fake.reset()

    on_exit(fn ->
      Application.put_env(:sqlete, :storage_module, previous_storage)
      Fake.reset()
    end)

    :ok
  end

  test "perform/1 extracts fields and enqueues LLM processing" do
    {:ok, storage_key} = Fake.store("%PDF-1.7 sample", filename: "notice.pdf")

    {:ok, doc_file} =
      %DocumentFile{}
      |> DocumentFile.changeset(%{
        filename: "notice.pdf",
        content_type: "application/pdf",
        byte_size: byte_size("%PDF-1.7 sample"),
        checksum: "abc123",
        storage_key: storage_key,
        status: :queued,
        metadata: %{"collection" => "hearings", "source" => "worker-test"}
      })
      |> Repo.insert()

    assert :ok ==
             ProcessPdfWorker.perform(%Oban.Job{
               args: %{"document_file_id" => doc_file.id}
             })

    updated = Repo.get!(DocumentFile, doc_file.id)

    assert updated.status == :processing
    assert updated.doc_type == "otro"
    assert updated.organismo == "Fake Organismo"
    assert is_binary(updated.arcana_document_id)

    [llm_job] =
      Repo.all(from(j in Oban.Job, where: j.worker == ^"SQLete.Documents.LlmProcessingWorker"))

    assert llm_job.args["document_file_id"] == doc_file.id
    assert llm_job.args["arcana_document_id"] == updated.arcana_document_id
  end

  test "perform/1 marks a document as failed when extraction fails" do
    {:ok, storage_key} = Fake.store("%PDF failure", filename: "failure.pdf")

    {:ok, doc_file} =
      %DocumentFile{}
      |> DocumentFile.changeset(%{
        filename: "failure.pdf",
        content_type: "application/pdf",
        byte_size: byte_size("%PDF failure"),
        checksum: "def456",
        storage_key: storage_key,
        status: :queued,
        metadata: %{}
      })
      |> Repo.insert()

    assert {:error, :boom} ==
             ProcessPdfWorker.perform(%Oban.Job{
               args: %{"document_file_id" => doc_file.id}
             })

    updated = Repo.get!(DocumentFile, doc_file.id)

    assert updated.status == :failed
    assert updated.metadata["processing_error"] == ":boom"
    assert updated.metadata["arcana"]["provider"] == "arcana"
    assert updated.metadata["arcana"]["status"] == "failed"
  end
end
