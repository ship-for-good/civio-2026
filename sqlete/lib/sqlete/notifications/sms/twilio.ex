defmodule SQLete.Notifications.Sms.Twilio do
  @moduledoc """
  Twilio SMS adapter (Messages API). Shares the same Twilio credentials as the
  voice adapter.

  Config (set in `config/runtime.exs` from env vars):

      config :sqlete, SQLete.Notifications.Sms.Twilio,
        account_sid: System.get_env("TWILIO_ACCOUNT_SID"),
        auth_token: System.get_env("TWILIO_AUTH_TOKEN"),
        from: System.get_env("TWILIO_FROM_NUMBER")
  """
  @behaviour SQLete.Notifications.Sms

  require Logger

  @api_base "https://api.twilio.com/2010-04-01"

  @impl true
  def send(to, body, _opts \\ []) do
    config = config()

    with {:ok, account_sid} <- fetch(config, :account_sid),
         {:ok, auth_token} <- fetch(config, :auth_token),
         {:ok, from} <- fetch(config, :from) do
      url = "#{@api_base}/Accounts/#{account_sid}/Messages.json"
      form = %{"To" => to, "From" => from, "Body" => body}

      case Req.post(url, form: form, auth: {:basic, "#{account_sid}:#{auth_token}"}) do
        {:ok, %Req.Response{status: status, body: resp}} when status in 200..299 ->
          {:ok, %{sid: resp["sid"], status: resp["status"] || "queued"}}

        {:ok, %Req.Response{status: status, body: resp}} ->
          Logger.error("[Sms.Twilio] HTTP #{status}: #{inspect(resp)}")
          {:error, {:http_error, status, twilio_message(resp)}}

        {:error, reason} ->
          Logger.error("[Sms.Twilio] request failed: #{inspect(reason)}")
          {:error, reason}
      end
    end
  end

  defp twilio_message(%{"message" => message}), do: message
  defp twilio_message(_resp), do: "twilio_error"

  defp config, do: Application.get_env(:sqlete, __MODULE__, [])

  defp fetch(config, key) do
    case Keyword.get(config, key) do
      value when is_binary(value) and value != "" -> {:ok, value}
      _ -> {:error, {:missing_config, key}}
    end
  end
end
