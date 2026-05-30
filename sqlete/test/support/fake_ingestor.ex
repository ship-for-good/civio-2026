defmodule SQLete.Documents.FakeIngestor do
  @behaviour SQLete.Documents.Ingestor

  alias SQLete.Documents.DocumentFile

  @impl true
  def ingest_pdf("%PDF failure", _doc_file), do: {:error, :boom}

  def ingest_pdf(_pdf_binary, %DocumentFile{} = doc_file) do
    {:ok,
     %{
       "provider" => "arcana",
       "status" => "completed",
       "document_id" => "arcana-#{doc_file.id}",
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
