defmodule SQLete.Alerts.CallWorker do
  @moduledoc """
  Sends a single deadline alert via `SQLete.Alerts.notify/1` (SMS/call per config).

  `unique` guards against enqueuing two notifications for the same expediente
  within ~20h (e.g. an extra cron tick or a retry), on top of the per-deadline
  dedup in `Alerts.due_now/0`.
  """
  use Oban.Worker,
    queue: :alerts,
    max_attempts: 3,
    unique: [period: 72_000, fields: [:worker, :args]]

  alias SQLete.Alerts

  @impl true
  def perform(%Oban.Job{args: %{"external_id" => external_id}}) do
    case Alerts.notify(external_id) do
      {:ok, _call} -> :ok
      # A recorded failure (no phone, provider error) is not worth retrying blindly.
      {:error, :not_found} -> {:cancel, :not_found}
      {:error, _call_or_reason} -> :ok
    end
  end
end
