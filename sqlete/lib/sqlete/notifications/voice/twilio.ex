defmodule SQLete.Notifications.Voice.Twilio do
  @moduledoc """
  Twilio Programmable Voice adapter.

  Places an outbound call via the Twilio REST API, passing the spoken message as
  inline TwiML (`<Say>`), so no public webhook/callback URL is required. The
  message is read with the Spanish Amazon Polly voice "Lucia".

  Config (set in `config/runtime.exs` from env vars):

      config :sqlete, SQLete.Notifications.Voice.Twilio,
        account_sid: System.get_env("TWILIO_ACCOUNT_SID"),
        auth_token: System.get_env("TWILIO_AUTH_TOKEN"),
        from: System.get_env("TWILIO_FROM_NUMBER")
  """
  @behaviour SQLete.Notifications.Voice

  require Logger

  @voice "Polly.Lucia"
  @api_base "https://api.twilio.com/2010-04-01"

  @impl true
  def call(to, message, opts \\ []) do
    config = config()

    with {:ok, account_sid} <- fetch(config, :account_sid),
         {:ok, auth_token} <- fetch(config, :auth_token),
         {:ok, from} <- fetch(config, :from) do
      url = "#{@api_base}/Accounts/#{account_sid}/Calls.json"

      form = %{
        "To" => to,
        "From" => from,
        "Twiml" => twiml(message)
      }

      case Req.post(url, form: form, auth: {:basic, "#{account_sid}:#{auth_token}"}) do
        {:ok, %Req.Response{status: status, body: body}} when status in 200..299 ->
          {:ok, %{sid: body["sid"], status: body["status"] || "queued"}}

        {:ok, %Req.Response{status: status, body: body}} ->
          Logger.error("[Voice.Twilio] HTTP #{status}: #{inspect(body)}")
          {:error, {:http_error, status, twilio_message(body)}}

        {:error, reason} ->
          Logger.error("[Voice.Twilio] request failed: #{inspect(reason)}")
          {:error, reason}
      end
    end
    |> tap_opts(opts)
  end

  defp twiml(message) do
    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" <>
      "<Response><Say voice=\"#{@voice}\">#{escape(message)}</Say></Response>"
  end

  defp escape(text) do
    text
    |> to_string()
    |> String.replace("&", "&amp;")
    |> String.replace("<", "&lt;")
    |> String.replace(">", "&gt;")
    |> String.replace("\"", "&quot;")
    |> String.replace("'", "&apos;")
  end

  defp twilio_message(%{"message" => message}), do: message
  defp twilio_message(_body), do: "twilio_error"

  defp config, do: Application.get_env(:sqlete, __MODULE__, [])

  defp fetch(config, key) do
    case Keyword.get(config, key) do
      value when is_binary(value) and value != "" -> {:ok, value}
      _ -> {:error, {:missing_config, key}}
    end
  end

  # Hook for tests/telemetry; no-op in normal operation.
  defp tap_opts(result, _opts), do: result
end
