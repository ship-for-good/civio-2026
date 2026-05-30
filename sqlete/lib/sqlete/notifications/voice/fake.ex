defmodule SQLete.Notifications.Voice.Fake do
  @moduledoc """
  No-op voice adapter for dev/test: logs the call instead of dialing, so the
  whole alert flow (history, mute, UI) works without a provider account or cost.
  Default adapter unless `ALERTS_VOICE_ADAPTER=twilio`.
  """
  @behaviour SQLete.Notifications.Voice

  require Logger

  @impl true
  def call(to, message, _opts \\ []) do
    Logger.info("[Voice.Fake] would call #{to}: #{message}")
    {:ok, %{sid: "fake-" <> Ecto.UUID.generate(), status: "queued"}}
  end
end
