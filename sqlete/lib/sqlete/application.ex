defmodule SQLete.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      SQLeteWeb.Telemetry,
      SQLete.Repo
    ] ++ arcana_children() ++ [
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
    if Application.get_env(:sqlete, :documents_arcana_graph, true) or Arcana.Graph.enabled?() do
      [Arcana.Graph.NERServing]
    else
      []
    end
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    SQLeteWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
