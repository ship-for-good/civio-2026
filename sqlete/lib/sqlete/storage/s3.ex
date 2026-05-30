defmodule SQLete.Storage.S3 do
  @moduledoc """
  MinIO-backed S3-compatible object storage implementation.

  Stores PDF binaries under namespaced keys such as
  `uploads/YYYY-MM-DD/filename-UUID.ext`.
  """

  @behaviour SQLete.Storage

  @impl true
  def store(bytes, opts \\ []) when is_binary(bytes) do
    key = storage_key(opts)

    bucket = bucket_name()
    content_type = Keyword.get(opts, :content_type, "application/octet-stream")

    with :ok <- ensure_bucket_exists(bucket),
         {:ok, _response} <-
           ExAws.S3.put_object(bucket, key, bytes, content_type: content_type) |> ExAws.request() do
      {:ok, key}
    else
      {:error, reason} -> {:error, normalize_error(reason)}
      reason -> {:error, normalize_error(reason)}
    end
  end

  @impl true
  def get(key) do
    case ExAws.S3.get_object(bucket_name(), key) |> ExAws.request() do
      {:ok, %{body: body}} -> {:ok, body}
      {:error, reason} -> {:error, normalize_error(reason)}
    end
  end

  @impl true
  def delete(key) do
    case ExAws.S3.delete_object(bucket_name(), key) |> ExAws.request() do
      {:ok, _} -> :ok
      {:error, reason} -> {:error, normalize_error(reason)}
    end
  end

  defp storage_key(opts) do
    filename = Keyword.get(opts, :filename, "upload")
    ext = Path.extname(filename)
    root = Path.rootname(filename)
    date = Date.utc_today() |> to_string()
    uuid = Ecto.UUID.generate()

    "uploads/#{date}/#{storage_safe(root)}-#{uuid}#{ext}"
  end

  defp storage_safe(value) do
    value
    |> String.replace(~r/[^a-zA-Z0-9_\-.]/, "_")
    |> String.slice(0, 64)
    |> case do
      "" -> "upload"
      safe_value -> safe_value
    end
  end

  defp ensure_bucket_exists(bucket) do
    case ExAws.S3.head_bucket(bucket) |> ExAws.request() do
      {:ok, _} -> :ok
      {:error, {:http_error, 404, _}} -> create_bucket(bucket)
      {:error, {:http_error, 301, _}} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp create_bucket(bucket) do
    case ExAws.S3.put_bucket(bucket, bucket_region()) |> ExAws.request() do
      {:ok, _} -> :ok
      {:error, {:http_error, 409, _}} -> :ok
      {:error, reason} -> {:error, reason}
    end
  end

  defp normalize_error({:http_error, 403, _body}), do: :access_denied
  defp normalize_error({:http_error, 404, _body}), do: :not_found
  defp normalize_error({:http_error, 409, _body}), do: :bucket_already_exists
  defp normalize_error({:storage_error, reason}), do: {:storage_error, reason}
  defp normalize_error(reason), do: {:storage_error, reason}

  defp bucket_name do
    Application.get_env(:sqlete, :storage_bucket, "sqlete-pdfs")
  end

  defp bucket_region do
    Application.get_env(:ex_aws, :region, "us-east-1")
  end
end
