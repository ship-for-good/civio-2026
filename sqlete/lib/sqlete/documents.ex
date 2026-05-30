defmodule SQLete.Documents do
  @moduledoc """
  Backend boundary for PDF ingestion.

  This context owns the public entrypoint for accepting PDF binaries and
  delegates execution to the configured ingestion pipeline.
  """

  alias SQLete.Documents.Document
  alias SQLete.Documents.IngestionRequest

  @type ingest_attrs :: keyword() | map()

  @spec ingest_pdf(binary(), ingest_attrs()) :: {:ok, Document.t()} | {:error, term()}
  def ingest_pdf(pdf_binary, attrs \\ %{})

  def ingest_pdf(pdf_binary, attrs) when is_binary(pdf_binary) and (is_list(attrs) or is_map(attrs)) do
    attrs = normalize_attrs(attrs)

    with :ok <- validate_pdf_binary(pdf_binary),
         {:ok, request} <- IngestionRequest.new(pdf_binary, attrs) do
      pipeline().ingest(request)
    end
  end

  def ingest_pdf(pdf_binary, _attrs) when is_binary(pdf_binary), do: {:error, :invalid_attrs}

  def ingest_pdf(_pdf_binary, _attrs), do: {:error, :invalid_pdf_binary}

  @spec pipeline() :: module()
  def pipeline do
    Application.get_env(:sqlete, :documents_pipeline, SQLete.Documents.NoopPipeline)
  end

  defp normalize_attrs(attrs) when is_list(attrs), do: Map.new(attrs)
  defp normalize_attrs(attrs) when is_map(attrs), do: attrs

  defp validate_pdf_binary(pdf_binary) do
    if byte_size(pdf_binary) > 0 do
      :ok
    else
      {:error, :empty_pdf_binary}
    end
  end
end
