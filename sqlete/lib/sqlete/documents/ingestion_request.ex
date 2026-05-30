defmodule SQLete.Documents.IngestionRequest do
  @moduledoc """
  Normalized input for the PDF ingestion pipeline.
  """

  @enforce_keys [:contents, :filename, :content_type, :byte_size, :checksum, :metadata]
  defstruct [:contents, :filename, :content_type, :byte_size, :checksum, :metadata]

  @type t :: %__MODULE__{
          contents: binary(),
          filename: String.t(),
          content_type: String.t(),
          byte_size: non_neg_integer(),
          checksum: String.t(),
          metadata: map()
        }

  @spec new(binary(), map()) :: {:ok, t()} | {:error, term()}
  def new(contents, attrs) when is_binary(contents) and is_map(attrs) do
    filename = Map.get(attrs, :filename) || Map.get(attrs, "filename") || default_filename()

    content_type =
      attrs
      |> Map.get(:content_type, Map.get(attrs, "content_type", "application/pdf"))
      |> normalize_content_type()

    metadata =
      attrs
      |> Map.drop([:filename, "filename", :content_type, "content_type"])

    request = %__MODULE__{
      contents: contents,
      filename: filename,
      content_type: content_type,
      byte_size: byte_size(contents),
      checksum: checksum(contents),
      metadata: metadata
    }

    validate(request)
  end

  defp validate(%__MODULE__{filename: filename, content_type: content_type} = request)
       when is_binary(filename) and filename != "" and content_type == "application/pdf" do
    {:ok, request}
  end

  defp validate(%__MODULE__{filename: filename}) when not is_binary(filename) or filename == "" do
    {:error, :invalid_filename}
  end

  defp validate(%__MODULE__{}), do: {:error, :unsupported_content_type}

  defp checksum(contents) do
    :sha256
    |> :crypto.hash(contents)
    |> Base.encode16(case: :lower)
  end

  defp normalize_content_type(content_type) when is_binary(content_type) do
    content_type
    |> String.split(";", parts: 2)
    |> hd()
    |> String.trim()
    |> String.downcase()
  end

  defp default_filename, do: "upload.pdf"
end
