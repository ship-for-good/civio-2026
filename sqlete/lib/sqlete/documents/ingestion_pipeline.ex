defmodule SQLete.Documents.IngestionPipeline do
  @moduledoc """
  Behaviour for the concrete PDF ingestion pipeline.

  Future steps will plug storage, job enqueueing, extraction, and Arcana
  ingestion behind this contract.
  """

  alias SQLete.Documents.Document
  alias SQLete.Documents.IngestionRequest

  @callback ingest(IngestionRequest.t()) :: {:ok, Document.t()} | {:error, term()}
end
