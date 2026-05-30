defmodule SQLete.Inbox do
  @moduledoc """
  Read-side boundary for the inbox UI (dashboard, detail, redistribution).

  Delegates to the configured source module (`:inbox_source`), mirroring the
  pattern used by `SQLete.Documents` for the write pipeline. The frontend depends
  only on the functions here; swapping `FakeSource` for an Ecto-backed source is a
  one-line config change.

  Real-time updates: LiveViews call `subscribe/0` on mount and handle
  `{:document_updated, id}` / `{:inbox_changed, _}` messages broadcast on the
  `"inbox"` topic of `SQLete.PubSub`.
  """

  alias SQLete.Inbox.Solicitud

  @pubsub SQLete.PubSub
  @topic "inbox"

  @spec source() :: module()
  def source do
    Application.get_env(:sqlete, :inbox_source, SQLete.Inbox.FakeSource)
  end

  @spec list_solicitudes(map()) :: [Solicitud.t()]
  def list_solicitudes(filters \\ %{}), do: source().list_solicitudes(filters)

  @spec get_solicitud!(term()) :: Solicitud.t()
  def get_solicitud!(id), do: source().get_solicitud!(id)

  @spec list_redistribution_groups() :: [%{parent: Solicitud.t(), children: [Solicitud.t()]}]
  def list_redistribution_groups, do: source().list_redistribution_groups()

  @spec dashboard_stats() :: map()
  def dashboard_stats, do: source().dashboard_stats()

  @doc "Subscribe the calling process to inbox change broadcasts."
  @spec subscribe() :: :ok | {:error, term()}
  def subscribe, do: Phoenix.PubSub.subscribe(@pubsub, @topic)

  @doc "Broadcast an inbox change to all subscribers."
  @spec broadcast(term()) :: :ok
  def broadcast(message) do
    Phoenix.PubSub.broadcast(@pubsub, @topic, message)
  end
end
