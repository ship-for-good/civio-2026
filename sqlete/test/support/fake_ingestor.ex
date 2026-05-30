defmodule SQLete.Documents.FakeIngestor do
  @behaviour SQLete.Documents.Ingestor

  alias SQLete.Documents.DocumentFile
  alias SQLete.Repo

  @impl true
  def ingest_pdf("%PDF failure", _doc_file), do: {:error, :boom}

  def ingest_pdf(_pdf_binary, %DocumentFile{} = doc_file) do
    collection_name = collection(doc_file)
    {:ok, arcana_collection} = Arcana.Collection.get_or_create(collection_name, Repo)

    {:ok, arcana_doc} =
      %Arcana.Document{}
      |> Arcana.Document.changeset(%{
        content: "fake extracted text",
        source_id: source_id(doc_file),
        collection_id: arcana_collection.id,
        status: :completed,
        chunk_count: 1
      })
      |> Repo.insert()

    {:ok,
     %{
       "provider" => "arcana",
       "status" => "completed",
       "document_id" => arcana_doc.id,
       "source_id" => source_id(doc_file),
       "collection" => collection_name,
       "graph_enabled" => false,
       "chunk_count" => 1,
       "completed_at" => "2026-05-30T00:00:00Z"
     }}
  end

  @impl true
  def extract_fields("%PDF failure", _doc_file), do: {:error, :boom}

  def extract_fields(_pdf_binary, %DocumentFile{} = _doc_file) do
    {:ok,
     %{
       text: "fake extracted text",
       fields: %{doc_type: "otro", organismo: "Fake Organismo"}
     }}
  end

  @impl true
  def create_arcana_document(text, %DocumentFile{} = doc_file) do
    collection_name = collection(doc_file)
    {:ok, arcana_collection} = Arcana.Collection.get_or_create(collection_name, Repo)

    {:ok, arcana_doc} =
      %Arcana.Document{}
      |> Arcana.Document.changeset(%{
        content: text,
        source_id: source_id(doc_file),
        collection_id: arcana_collection.id,
        status: :processing
      })
      |> Repo.insert()

    {:ok, arcana_doc}
  end

  @impl true
  def process_graph(%Arcana.Document{} = arcana_doc, %DocumentFile{} = doc_file) do
    {:ok, finalized} =
      arcana_doc
      |> Arcana.Document.changeset(%{status: :completed, chunk_count: 1})
      |> Repo.update()

    {:ok,
     %{
       "provider" => "arcana",
       "status" => "completed",
       "document_id" => finalized.id,
       "source_id" => source_id(doc_file),
       "collection" => collection(doc_file),
       "graph_enabled" => false,
       "chunk_count" => 1,
       "completed_at" => "2026-05-30T00:00:00Z"
     }}
  end

  defp source_id(%DocumentFile{metadata: metadata, id: id}) do
    metadata = metadata || %{}
    Map.get(metadata, "source_id") || Map.get(metadata, "source") || id
  end

  defp collection(%DocumentFile{metadata: metadata}) do
    metadata = metadata || %{}
    Map.get(metadata, "collection") || "documents"
  end
end
