defmodule SQLete.AIConfigTest do
  use ExUnit.Case, async: true

  alias SQLete.AIConfig

  test "defaults to OpenAI in dev" do
    config = AIConfig.runtime_config(:dev, %{})

    assert Keyword.fetch!(config.embedder, :base_url) == "https://api.openai.com"
    assert Keyword.fetch!(config.embedder, :model) == "text-embedding-3-small"
    assert Keyword.fetch!(config.embedder, :dimensions) == 1536
    assert is_nil(Keyword.get(config.embedder, :api_key))

    assert Keyword.fetch!(config.llm, :model) == "gpt-5-mini"
    # gpt-5 models only accept the default temperature.
    assert Keyword.fetch!(config.llm, :temperature) == 1.0
  end

  test "defaults to OpenAI in prod" do
    config = AIConfig.runtime_config(:prod, %{"OPENAI_API_KEY" => "test-key"})

    assert Keyword.fetch!(config.embedder, :base_url) == "https://api.openai.com"
    assert Keyword.fetch!(config.embedder, :model) == "text-embedding-3-small"
    assert Keyword.fetch!(config.embedder, :dimensions) == 1536
    assert Keyword.fetch!(config.embedder, :api_key) == "test-key"

    assert Keyword.fetch!(config.llm, :model) == "gpt-5-mini"
    assert Keyword.fetch!(config.llm, :api_key) == "test-key"
  end

  test "allows custom OpenAI settings via env vars" do
    config =
      AIConfig.runtime_config(:dev, %{
        "OPENAI_API_KEY" => "test-key",
        "OPENAI_BASE_URL" => "https://example.com",
        "OPENAI_EMBEDDER_MODEL" => "text-embedding-3-large",
        "OPENAI_EMBEDDER_DIMENSIONS" => "1024",
        "OPENAI_LLM_MODEL" => "gpt-5",
        "OPENAI_LLM_TEMPERATURE" => "0.25"
      })

    assert Keyword.fetch!(config.embedder, :base_url) == "https://example.com"
    assert Keyword.fetch!(config.embedder, :model) == "text-embedding-3-large"
    assert Keyword.fetch!(config.embedder, :dimensions) == 1024
    assert Keyword.fetch!(config.llm, :model) == "gpt-5"
    assert Keyword.fetch!(config.llm, :temperature) == 0.25
  end

  test "api_key is nil when not provided" do
    config = AIConfig.runtime_config(:dev, %{})

    assert is_nil(Keyword.get(config.embedder, :api_key))
    assert is_nil(Keyword.get(config.llm, :api_key))
  end
end
