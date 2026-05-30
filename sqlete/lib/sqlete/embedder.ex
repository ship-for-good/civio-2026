defmodule SQLete.Embedder do
  @moduledoc """
  OpenAI-compatible embedder for Arcana document and entity embeddings.
  """

  @behaviour Arcana.Embedder

  @impl true
  @spec embed(String.t(), keyword()) :: {:ok, [float()]} | {:error, term()}
  def embed(text, opts \\ []) when is_binary(text) do
    ReqLLM.Embedding.embed(model_spec(opts), text, req_opts(opts))
  end

  @impl true
  @spec embed_batch([String.t()], keyword()) :: {:ok, [[float()]]} | {:error, term()}
  def embed_batch(texts, opts \\ []) when is_list(texts) do
    ReqLLM.Embedding.embed(model_spec(opts), texts, req_opts(opts))
  end

  @impl true
  @spec dimensions(keyword()) :: pos_integer()
  def dimensions(opts \\ []) do
    Keyword.get(embedder_config(opts), :dimensions, 1536)
  end

  @spec health_check() :: :ok | {:error, term()}
  def health_check do
    case Req.get(models_url(), receive_timeout: 5_000) do
      {:ok, %Req.Response{status: 200}} -> :ok
      {:ok, %Req.Response{status: status}} -> {:error, {:http_error, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp embedder_config(overrides) do
    Application.get_env(:sqlete, :embedder, [])
    |> Keyword.merge(overrides)
  end

  defp req_opts(overrides) do
    config = embedder_config(overrides)
    timeout = Keyword.get(config, :timeout, 120_000)

    [
      base_url: api_base_url(config),
      req_http_options: [receive_timeout: timeout, pool_timeout: timeout]
    ]
    |> maybe_put(:dimensions, Keyword.get(config, :dimensions))
    |> maybe_put(:api_key, Keyword.get(config, :api_key))
    |> maybe_put(:provider_options, Keyword.get(config, :provider_options))
  end

  defp model_spec(overrides) do
    config = embedder_config(overrides)
    "openai:" <> Keyword.get(config, :model, "text-embedding-3-small")
  end

  defp api_base_url(config) do
    config
    |> Keyword.get(:base_url, "https://api.openai.com/v1")
    |> normalize_openai_base_url()
  end

  defp models_url do
    embedder_config([])
    |> api_base_url()
    |> Kernel.<>("/models")
  end

  defp normalize_openai_base_url(url) when is_binary(url) do
    url
    |> String.trim_trailing("/")
    |> then(fn
      url when byte_size(url) >= 3 and binary_part(url, byte_size(url), -3) == "/v1" -> url
      url -> url <> "/v1"
    end)
  end

  defp maybe_put(opts, _key, nil), do: opts
  defp maybe_put(opts, key, value), do: Keyword.put(opts, key, value)
end
