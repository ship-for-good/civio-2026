defmodule SQLete.Documents.Ingestor do
  @moduledoc """
  Behaviour for async document ingestors.

  Implementations receive the stored PDF bytes and document file record,
  then return a summary suitable for persistence in the document metadata.
  """

  alias SQLete.Documents.DocumentFile

  @callback ingest_pdf(binary(), DocumentFile.t()) :: {:ok, map()} | {:error, term()}

  @callback extract_fields(binary(), DocumentFile.t()) ::
              {:ok, %{text: String.t(), fields: map()}} | {:error, term()}

  @callback create_arcana_document(String.t(), DocumentFile.t()) ::
              {:ok, term()} | {:error, term()}

  @callback process_graph(term(), DocumentFile.t()) :: {:ok, map()} | {:error, term()}
end
