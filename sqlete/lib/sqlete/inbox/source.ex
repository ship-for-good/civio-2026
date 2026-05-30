defmodule SQLete.Inbox.Source do
  @moduledoc """
  Behaviour for the read-side data source backing the inbox UI.

  The frontend only ever talks to `SQLete.Inbox`, which delegates to the module
  configured under `:inbox_source`. Provide an implementation (e.g. an Ecto-backed
  one) and point the config at it without touching the LiveViews:

      config :sqlete, :inbox_source, SQLete.Inbox.EctoSource

  Every `solicitud` returned must be a `SQLete.Inbox.Solicitud` view-struct with the
  deadline fields (estado, semaforo, dias_para_reclamar, ...) already computed.
  """

  alias SQLete.Inbox.Solicitud

  @type filters :: %{
          optional(:estado) => term(),
          optional(:autor) => term(),
          optional(:ambito) => term(),
          optional(:q) => term()
        }
  @type group :: %{parent: Solicitud.t(), children: [Solicitud.t()]}

  @callback list_solicitudes(filters()) :: [Solicitud.t()]
  @callback get_solicitud!(id :: term()) :: Solicitud.t()
  @callback list_redistribution_groups() :: [group()]
  @callback dashboard_stats() :: map()
end
