defmodule SQLete.Alerts do
  @moduledoc """
  Deadline-alert boundary: decides which expedientes must be called, places the
  call through the configured voice adapter, records the call history and powers
  the `/alertas` page (mute + history).

  An "alert" is a `Solicitud` in an *a reclamar* estado, enriched with its
  `Setting` (mute/phone) and its `Call` history. Calls are deduped per claim
  deadline so an expediente is only phoned once per window.
  """

  import Ecto.Query

  alias SQLete.Alerts.Call
  alias SQLete.Alerts.Setting
  alias SQLete.Inbox
  alias SQLete.Repo

  @pubsub SQLete.PubSub
  @topic "alerts"

  @reclamable_estados [:a_reclamar_silencio, :a_reclamar_incompleta]

  @type alert :: %{
          external_id: String.t(),
          solicitud: map(),
          dias: integer() | nil,
          fecha_limite: Date.t() | nil,
          phone: String.t() | nil,
          silenced: boolean(),
          threshold: integer(),
          calls: [Call.t()],
          last_call: Call.t() | nil
        }

  # ---------------------------------------------------------------------------
  # Reads
  # ---------------------------------------------------------------------------

  @doc "All expedientes a-reclamar, enriched with mute settings + call history."
  @spec list_alerts() :: [alert()]
  def list_alerts do
    settings = settings_by_external_id()
    calls = calls_by_external_id()

    Inbox.list_solicitudes()
    |> Enum.filter(&reclamable?/1)
    |> Enum.map(&build_alert(&1, settings, calls))
  end

  @doc "Alerts that should be called right now (≤ threshold, not silenced, not yet called this window)."
  @spec due_now() :: [alert()]
  def due_now do
    list_alerts()
    |> Enum.filter(fn a ->
      not a.silenced and is_integer(a.dias) and a.dias <= a.threshold and not already_called?(a)
    end)
  end

  @doc "Call history for an expediente, most recent first."
  @spec history_for(String.t()) :: [Call.t()]
  def history_for(external_id) do
    Repo.all(
      from c in Call, where: c.external_id == ^external_id, order_by: [desc: c.inserted_at]
    )
  end

  defp reclamable?(sol), do: sol.estado in @reclamable_estados

  defp build_alert(sol, settings, calls) do
    setting = Map.get(settings, sol.external_id)
    history = Map.get(calls, sol.external_id, [])

    %{
      external_id: sol.external_id,
      solicitud: sol,
      dias: sol.dias_para_reclamar,
      fecha_limite: sol.fecha_limite_reclamacion_ctbg,
      phone: phone(setting),
      silenced: silenced?(setting),
      threshold: threshold(setting),
      calls: history,
      last_call: List.first(history)
    }
  end

  defp already_called?(%{calls: calls, fecha_limite: limite}) do
    Enum.any?(calls, fn c -> c.status != "failed" and c.fecha_limite == limite end)
  end

  # ---------------------------------------------------------------------------
  # Placing calls
  # ---------------------------------------------------------------------------

  @doc """
  Notify the deadline for an expediente through the configured channel(s) and
  record it in the history. Returns `{:ok, call}` on success, `{:error, call}`
  when it could not be sent (the failed attempt is still recorded).

  The channel is `:sms` (default), `:call` or `:both` (config `:alerts -> :channel`).
  """
  @spec notify(String.t()) :: {:ok, Call.t()} | {:error, Call.t() | term()}
  def notify(external_id) when is_binary(external_id) do
    case find_alert(external_id) do
      nil -> {:error, :not_found}
      alert -> do_notify(alert)
    end
  end

  defp do_notify(alert) do
    to = destination(alert)

    if is_nil(to) or to == "" do
      record(%{
        external_id: alert.external_id,
        channel: to_string(record_channel(channel())),
        dias_restantes: alert.dias,
        fecha_limite: alert.fecha_limite,
        status: "failed",
        error: "sin_telefono"
      })
    else
      dispatch(channel(), alert, to)
    end
  end

  defp dispatch(:call, alert, to), do: place_voice(alert, to)
  defp dispatch(:sms, alert, to), do: send_sms(alert, to)

  defp dispatch(:both, alert, to) do
    _ = place_voice(alert, to)
    send_sms(alert, to)
  end

  defp place_voice(alert, to) do
    base = base_attrs(alert, "call", to)

    case voice_adapter().call(to, build_voice_message(alert)) do
      {:ok, %{sid: sid, status: status}} ->
        record(Map.merge(base, %{status: status, provider_sid: sid}))

      {:error, reason} ->
        record(Map.merge(base, %{status: "failed", error: inspect(reason)}))
    end
  end

  defp send_sms(alert, to) do
    base = base_attrs(alert, "sms", to)

    case sms_adapter().send(to, build_sms_message(alert)) do
      {:ok, %{sid: sid, status: status}} ->
        record(Map.merge(base, %{status: status, provider_sid: sid}))

      {:error, reason} ->
        record(Map.merge(base, %{status: "failed", error: inspect(reason)}))
    end
  end

  defp base_attrs(alert, channel, to) do
    %{
      external_id: alert.external_id,
      channel: channel,
      dias_restantes: alert.dias,
      fecha_limite: alert.fecha_limite,
      provider: provider_name(channel),
      phone: to
    }
  end

  defp record(attrs) do
    {:ok, call} =
      %Call{}
      |> Call.changeset(attrs)
      |> Repo.insert()

    broadcast({:alerts_changed, call.external_id})
    if call.status == "failed", do: {:error, call}, else: {:ok, call}
  end

  # Voice message (read aloud by TTS): longer, spells the reference out.
  defp build_voice_message(alert) do
    "Hola. Este es un aviso de SQLete. La reclamación del expediente #{say(alert.external_id)} " <>
      "ante el Consejo de Transparencia vence #{vence_text(alert.dias)}, el #{say_date(alert.fecha_limite)}. " <>
      "Por favor, revisa tu bandeja de SQLete para presentarla a tiempo. Repito: " <>
      "tienes #{dias_word(alert.dias)} para reclamar el expediente #{say(alert.external_id)}."
  end

  # SMS message: short, plain ASCII (cheaper, no UCS-2 surprises).
  defp build_sms_message(alert) do
    "SQLete: la reclamacion del expediente #{alert.external_id} vence #{vence_short(alert.dias)}" <>
      " (#{fmt_date_short(alert.fecha_limite)}). Entra en tu bandeja para presentarla a tiempo."
  end

  defp vence_short(d) when is_integer(d) and d <= 0, do: "hoy"
  defp vence_short(1), do: "manana"
  defp vence_short(d) when is_integer(d), do: "en #{d} dias"
  defp vence_short(_), do: "pronto"

  defp fmt_date_short(%Date{} = d), do: "#{pad(d.day)}/#{pad(d.month)}/#{d.year}"
  defp fmt_date_short(_), do: "fecha proxima"

  defp pad(n) when n < 10, do: "0#{n}"
  defp pad(n), do: "#{n}"

  defp vence_text(d) when is_integer(d) and d <= 0, do: "hoy mismo"
  defp vence_text(d) when is_integer(d), do: "en #{dias_word(d)}"
  defp vence_text(_), do: "muy pronto"

  defp dias_word(1), do: "un día"
  defp dias_word(d) when is_integer(d) and d >= 0, do: "#{d} días"
  defp dias_word(_), do: "pocos días"

  # Read the expediente reference digit by digit so the TTS doesn't mangle it.
  defp say(nil), do: "sin identificador"
  defp say(value), do: value |> to_string() |> String.replace("-", " ")

  defp say_date(%Date{} = d), do: "#{d.day} del #{d.month} de #{d.year}"
  defp say_date(_), do: "una fecha próxima"

  defp record_channel(:both), do: :sms
  defp record_channel(channel), do: channel

  # ---------------------------------------------------------------------------
  # Mute / settings
  # ---------------------------------------------------------------------------

  @doc "Silence the alert for an expediente (no more automatic calls)."
  @spec silence(String.t()) :: {:ok, Setting.t()} | {:error, Ecto.Changeset.t()}
  def silence(external_id), do: set_silenced(external_id, true)

  @doc "Re-enable automatic calls for an expediente."
  @spec unsilence(String.t()) :: {:ok, Setting.t()} | {:error, Ecto.Changeset.t()}
  def unsilence(external_id), do: set_silenced(external_id, false)

  defp set_silenced(external_id, value) do
    result = upsert_setting(external_id, %{silenced: value})
    with {:ok, _setting} <- result, do: broadcast({:alerts_changed, external_id})
    result
  end

  defp upsert_setting(external_id, attrs) do
    setting = Repo.get_by(Setting, external_id: external_id) || %Setting{}

    setting
    |> Setting.changeset(Map.put(attrs, :external_id, external_id))
    |> Repo.insert_or_update()
  end

  # ---------------------------------------------------------------------------
  # PubSub
  # ---------------------------------------------------------------------------

  @doc "Subscribe the caller to alert change broadcasts."
  def subscribe, do: Phoenix.PubSub.subscribe(@pubsub, @topic)

  @doc "Broadcast an alert change to subscribers."
  def broadcast(message), do: Phoenix.PubSub.broadcast(@pubsub, @topic, message)

  # ---------------------------------------------------------------------------
  # Config / helpers
  # ---------------------------------------------------------------------------

  defp find_alert(external_id), do: Enum.find(list_alerts(), &(&1.external_id == external_id))

  defp destination(%{phone: phone}) when is_binary(phone) and phone != "", do: phone
  defp destination(_alert), do: default_to_number()

  defp default_to_number, do: alerts_config() |> Keyword.get(:to_number)

  defp threshold(%Setting{threshold_days: days}) when is_integer(days), do: days
  defp threshold(_setting), do: alerts_config() |> Keyword.get(:threshold_days, 3)

  defp phone(%Setting{phone: phone}), do: phone
  defp phone(_setting), do: nil

  defp silenced?(%Setting{silenced: silenced}), do: silenced
  defp silenced?(_setting), do: false

  defp settings_by_external_id do
    Setting |> Repo.all() |> Map.new(&{&1.external_id, &1})
  end

  defp calls_by_external_id do
    Call
    |> order_by(desc: :inserted_at)
    |> Repo.all()
    |> Enum.group_by(& &1.external_id)
  end

  defp channel, do: alerts_config() |> Keyword.get(:channel, :sms)

  defp voice_adapter,
    do: Application.get_env(:sqlete, :voice_adapter, SQLete.Notifications.Voice.Fake)

  defp sms_adapter,
    do: Application.get_env(:sqlete, :sms_adapter, SQLete.Notifications.Sms.Fake)

  defp provider_name("sms"), do: module_name(sms_adapter())
  defp provider_name(_call), do: module_name(voice_adapter())

  defp module_name(module), do: module |> Module.split() |> List.last() |> String.downcase()

  defp alerts_config, do: Application.get_env(:sqlete, :alerts, [])
end
