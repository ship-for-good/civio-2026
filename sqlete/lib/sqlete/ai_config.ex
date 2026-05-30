defmodule SQLete.AIConfig do
  @moduledoc false

  @openai_base_url "https://api.openai.com"
  @openai_embedder_model "text-embedding-3-small"
  @openai_llm_model "gpt-5-mini"

  def runtime_config(_config_env, env \\ System.get_env()) when is_map(env) do
    %{
      embedder: embedder_config(env),
      llm: llm_config(env)
    }
  end

  defp embedder_config(env) do
    model = env_string(env, "OPENAI_EMBEDDER_MODEL", @openai_embedder_model)

    [
      base_url: env_string(env, "OPENAI_BASE_URL", @openai_base_url),
      api_key: Map.get(env, "OPENAI_API_KEY"),
      model: model,
      timeout: env_integer(env, "OPENAI_EMBEDDER_TIMEOUT", 120_000),
      dimensions: env_integer(env, "OPENAI_EMBEDDER_DIMENSIONS", openai_dimensions(model))
    ]
  end

  defp llm_config(env) do
    [
      base_url: env_string(env, "OPENAI_BASE_URL", @openai_base_url),
      api_key: Map.get(env, "OPENAI_API_KEY"),
      model: env_string(env, "OPENAI_LLM_MODEL", env_string(env, "LLM_MODEL", @openai_llm_model)),
      timeout: env_integer(env, "OPENAI_LLM_TIMEOUT", 600_000),
      # gpt-5 models count completion tokens (reasoning + output) here.
      max_tokens: env_integer(env, "OPENAI_LLM_MAX_TOKENS", 8_192),
      # gpt-5 models only accept the default temperature (1.0).
      temperature: env_float(env, "OPENAI_LLM_TEMPERATURE", 1.0)
    ]
  end

  defp env_string(env, name, default), do: Map.get(env, name, default)

  defp env_integer(env, name, default) do
    env
    |> env_string(name, Integer.to_string(default))
    |> String.to_integer()
  end

  defp env_float(env, name, default) do
    case Map.get(env, name) do
      nil ->
        default

      value ->
        case Float.parse(value) do
          {number, ""} -> number
          _other -> default
        end
    end
  end

  defp openai_dimensions("text-embedding-3-small"), do: 1536
  defp openai_dimensions("text-embedding-3-large"), do: 3072
  defp openai_dimensions(_other), do: 1536
end
