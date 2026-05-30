defmodule SQLete.Documents.LlmProcessingWorkerTest do
  use SQLete.DataCase, async: false

  alias SQLete.Documents.DocumentFile
  alias SQLete.Documents.LlmProcessingWorker

  setup do
    :ok
  end

  test "perform/1 processes graph and marks document as completed" do
    {:ok, collection} = Arcana.Collection.get_or_create("test_collection", Repo)

    {:ok, arcana_doc} =
      %Arcana.Document{}
      |> Arcana.Document.changeset(%{
        content: "test extracted text for graph processing",
        source_id: "llm-worker-test",
        collection_id: collection.id,
        status: :processing
      })
      |> Repo.insert()

    {:ok, doc_file} =
      %DocumentFile{}
      |> DocumentFile.changeset(%{
        filename: "processed.pdf",
        content_type: "application/pdf",
        byte_size: 100,
        checksum: "llm-test-checksum",
        storage_key: "none",
        status: :processing,
        arcana_document_id: arcana_doc.id,
        metadata: %{"collection" => "test_collection"}
      })
      |> Repo.insert()

    assert :ok ==
             LlmProcessingWorker.perform(%Oban.Job{
               args: %{
                 "document_file_id" => doc_file.id,
                 "arcana_document_id" => arcana_doc.id
               }
             })

    updated = Repo.get!(DocumentFile, doc_file.id)

    assert updated.status == :completed
    assert updated.metadata["arcana"]["provider"] == "arcana"
    assert updated.metadata["arcana"]["status"] == "completed"
    assert updated.metadata["arcana"]["chunk_count"] == 1
    assert updated.metadata["arcana"]["collection"] == "test_collection"
  end

  test "perform/1 marks document as failed when arcana document is missing" do
    {:ok, doc_file} =
      %DocumentFile{}
      |> DocumentFile.changeset(%{
        filename: "missing.pdf",
        content_type: "application/pdf",
        byte_size: 100,
        checksum: "missing-checksum",
        storage_key: "none",
        status: :processing,
        metadata: %{}
      })
      |> Repo.insert()

    fake_arcana_doc_id = Ecto.UUID.generate()

    assert {:error, :arcana_document_not_found} ==
             LlmProcessingWorker.perform(%Oban.Job{
               args: %{
                 "document_file_id" => doc_file.id,
                 "arcana_document_id" => fake_arcana_doc_id
               }
             })

    updated = Repo.get!(DocumentFile, doc_file.id)

    assert updated.status == :failed
    assert updated.metadata["llm_processing_error"] != nil
  end
end
