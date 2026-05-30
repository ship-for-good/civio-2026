defmodule SQLete.Notifications.Sms do
  @moduledoc """
  Behaviour for outbound SMS providers.

  Implementations send a text `body` to `to` and return the provider message id +
  initial status. Swapping providers is a one-line config change via `:sms_adapter`,
  mirroring `SQLete.Notifications.Voice`.
  """

  @type result :: %{sid: String.t() | nil, status: String.t()}

  @doc """
  Send an SMS with `body` to `to`. Returns `{:ok, result}` with the provider
  message id and initial status, or `{:error, reason}`.
  """
  @callback send(to :: String.t(), body :: String.t(), opts :: keyword()) ::
              {:ok, result()} | {:error, term()}
end
