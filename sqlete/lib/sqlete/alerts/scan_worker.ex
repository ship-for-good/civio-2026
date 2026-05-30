defmodule SQLete.Alerts.ScanWorker do
  @moduledoc """
  Daily Oban cron job: finds the expedientes whose claim deadline is within the
  alert threshold (and not silenced / not yet called this window) and enqueues a
  `CallWorker` for each. Scheduled from `config/config.exs` (`Oban.Plugins.Cron`).
  """
  use Oban.Worker, queue: :alerts, max_attempts: 3

  alias SQLete.Alerts
  alias SQLete.Alerts.CallWorker

  require Logger

  @impl true
  def perform(%Oban.Job{}) do
    due = Alerts.due_now()
    Logger.info("[Alerts.ScanWorker] #{length(due)} expediente(s) due for a call")

    due
    |> Enum.map(fn alert -> CallWorker.new(%{external_id: alert.external_id}) end)
    |> Oban.insert_all()

    :ok
  end
end
