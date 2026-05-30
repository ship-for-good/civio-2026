defmodule SQLete.Notifications.Voice do
  @moduledoc """
  Behaviour for outbound voice-call providers.

  Implementations place a phone call that reads `message` aloud (TTS) to `to`,
  and return the provider call id + initial status. Swapping providers (Twilio,
  Amazon Connect, ...) is a one-line config change via `:voice_adapter`, mirroring
  the `SQLete.Storage` / `SQLete.Inbox.Source` adapter pattern.
  """

  @type result :: %{sid: String.t() | nil, status: String.t()}

  @doc """
  Place a call to `to` that speaks `message`. Returns `{:ok, result}` with the
  provider call id and initial status, or `{:error, reason}`.
  """
  @callback call(to :: String.t(), message :: String.t(), opts :: keyword()) ::
              {:ok, result()} | {:error, term()}
end
