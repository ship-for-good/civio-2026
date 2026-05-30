defmodule SQLete.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children =
      [
        SQLeteWeb.Telemetry,
        SQLete.Repo
      ] ++
        arcana_children() ++
        [
          {Finch,
           name: SQLete.Finch,
           pools: %{default: [size: 25, count: 8, pool_max_idle_time: 120_000]}},
          {DNSCluster, query: Application.get_env(:sqlete, :dns_cluster_query) || :ignore},
          {Oban, Application.fetch_env!(:sqlete, Oban)},
          {Phoenix.PubSub, name: SQLete.PubSub},
          SQLeteWeb.Endpoint
        ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: SQLete.Supervisor]
    Supervisor.start_link(children, opts)
  end

  defp arcana_children do
    if Application.get_env(:sqlete, :enable_arcana_services, true) do
      embedder_children() ++ [Arcana.TaskSupervisor] ++ graph_children()
    else
      []
    end
  end

  defp embedder_children do
    case Arcana.Config.embedder() do
      {Arcana.Embedder.Local, opts} -> [{Arcana.Embedder.Local, opts}]
      _other -> []
    end
  end

  defp graph_children do
    if graph_services_enabled?() and needs_ner_serving?() do
      [Arcana.Graph.NERServing]
    else
      []
    end
  end

  defp graph_services_enabled? do
    Application.get_env(:sqlete, :documents_arcana_graph, true) or Arcana.Graph.enabled?()
  end

  defp needs_ner_serving? do
    graph_config = Application.get_env(:arcana, :graph, [])

    case Keyword.get(graph_config, :extractor) do
      nil -> entity_extractor_uses_ner?(Keyword.get(graph_config, :entity_extractor))
      _extractor -> false
    end
  end

  defp entity_extractor_uses_ner?(nil), do: true
  defp entity_extractor_uses_ner?(:ner), do: true
  defp entity_extractor_uses_ner?(Arcana.Graph.EntityExtractor.NER), do: true
  defp entity_extractor_uses_ner?({Arcana.Graph.EntityExtractor.NER, _opts}), do: true
  defp entity_extractor_uses_ner?(_other), do: false

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    SQLeteWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
