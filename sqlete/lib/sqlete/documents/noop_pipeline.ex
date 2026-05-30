defmodule SQLete.Documents.NoopPipeline do
  @moduledoc """
  Minimal ingestion pipeline used until the concrete storage and job steps exist.

  It returns a normalized accepted document so the public boundary is usable and
  testable before the rest of the pipeline is implemented.
  """

  @behaviour SQLete.Documents.IngestionPipeline

  alias SQLete.Documents.Document
  alias SQLete.Documents.IngestionRequest

  @impl true
  def ingest(%IngestionRequest{} = request) do
    {:ok,
     %Document{
       id: Ecto.UUID.generate(),
       filename: request.filename,
       content_type: request.content_type,
       byte_size: request.byte_size,
       checksum: request.checksum,
       status: :accepted,
       metadata: request.metadata
     }}
  end
end
