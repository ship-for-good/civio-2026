defmodule SQLete.LLM do
  @moduledoc """
  OpenAI LLM client for Arcana prompts.

  SQLete uses this client for graph extraction and retrieval prompts via the
  OpenAI API.
  """

  @spec complete(String.t()) :: {:ok, String.t()} | {:error, term()}
  def complete(prompt) when is_binary(prompt) do
    complete(prompt, [], [])
  end

  @spec complete(String.t(), list()) :: {:ok, String.t()} | {:error, term()}
  def complete(prompt, context) when is_binary(prompt) and is_list(context) do
    complete(prompt, context, [])
  end

  @spec complete(String.t(), list(), keyword()) :: {:ok, String.t()} | {:error, term()}
  def complete(prompt, context, opts) when is_binary(prompt) and is_list(context) do
    config = llm_config(opts)

    system_prompt =
      Keyword.get(opts, :system_prompt, Arcana.LLM.Helpers.default_system_prompt(context))

    llm_context =
      ReqLLM.Context.new([
        ReqLLM.Context.system(system_prompt),
        ReqLLM.Context.user(prompt)
      ])

    case ReqLLM.generate_text(model_spec(config), llm_context, req_opts(config)) do
      {:ok, response} ->
        case ReqLLM.Response.text(response) do
          nil -> {:error, :no_response_content}
          text -> {:ok, text}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end

  @spec health_check() :: :ok | {:error, term()}
  def health_check do
    case Req.get(models_url(), receive_timeout: 5_000) do
      {:ok, %Req.Response{status: 200}} -> :ok
      {:ok, %Req.Response{status: status}} -> {:error, {:http_error, status}}
      {:error, reason} -> {:error, reason}
    end
  end

  defp llm_config(overrides) do
    Application.get_env(:sqlete, :llm, [])
    |> Keyword.merge(overrides)
  end

  defp req_opts(config) do
    timeout = Keyword.get(config, :timeout, 600_000)

    [
      base_url: api_base_url(config),
      req_http_options: [receive_timeout: timeout, pool_timeout: timeout],
      temperature: Keyword.get(config, :temperature, 0.1),
      max_tokens: Keyword.get(config, :max_tokens, 8_192)
    ]
    |> maybe_put(:api_key, Keyword.get(config, :api_key))
    |> maybe_put(:provider_options, Keyword.get(config, :provider_options))
  end

  defp model_spec(config) do
    "openai:" <> Keyword.get(config, :model, "gpt-5.4-mini")
  end

  defp api_base_url(config) do
    config
    |> Keyword.get(:base_url, "https://api.openai.com/v1")
    |> normalize_openai_base_url()
  end

  defp models_url do
    llm_config([])
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
