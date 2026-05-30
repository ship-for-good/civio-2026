defmodule SQLete.Notifications.Sms.Fake do
  @moduledoc """
  No-op SMS adapter for dev/test: logs instead of sending, so the alert flow works
  without a provider account or cost. Default adapter unless ALERTS_PROVIDER=twilio.
  """
  @behaviour SQLete.Notifications.Sms

  require Logger

  @impl true
  def send(to, body, _opts \\ []) do
    Logger.info("[Sms.Fake] would text #{to}: #{body}")
    {:ok, %{sid: "fake-sms-" <> Ecto.UUID.generate(), status: "queued"}}
  end
end
