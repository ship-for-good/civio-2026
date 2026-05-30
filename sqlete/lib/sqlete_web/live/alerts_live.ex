defmodule SQLeteWeb.AlertsLive do
  @moduledoc """
  Alertas page: expedientes a-reclamar with their deadline call status, the full
  call history (expandable), a mute toggle per expediente and a "probar llamada"
  button that places a call on the spot through the configured voice adapter.
  """
  use SQLeteWeb, :live_view

  import SQLeteWeb.InboxComponents

  alias SQLete.Alerts
  alias SQLete.Inbox

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket) do
      Inbox.subscribe()
      Alerts.subscribe()
    end

    {:ok,
     socket
     |> assign(:page_title, "Alertas")
     |> assign(:expanded, MapSet.new())
     |> load_alerts()}
  end

  @impl true
  def handle_event("silence", %{"id" => external_id}, socket) do
    Alerts.silence(external_id)
    {:noreply, socket |> put_flash(:info, "Alerta silenciada.") |> load_alerts()}
  end

  def handle_event("unsilence", %{"id" => external_id}, socket) do
    Alerts.unsilence(external_id)
    {:noreply, socket |> put_flash(:info, "Alerta reactivada.") |> load_alerts()}
  end

  def handle_event("test-notify", %{"id" => external_id}, socket) do
    {flash_kind, message} =
      case Alerts.notify(external_id) do
        {:ok, call} ->
          {:info, "Aviso enviado por #{call.channel} (#{call.status}) al #{call.phone}."}

        {:error, %{error: "sin_telefono"}} ->
          {:error, "No hay teléfono destino configurado."}

        {:error, %{status: "failed"}} ->
          {:error, "No se pudo enviar el aviso."}

        {:error, _other} ->
          {:error, "No se pudo enviar el aviso."}
      end

    {:noreply, socket |> put_flash(flash_kind, message) |> load_alerts()}
  end

  def handle_event("toggle-history", %{"id" => external_id}, socket) do
    expanded = toggle(socket.assigns.expanded, external_id)
    {:noreply, assign(socket, :expanded, expanded)}
  end

  @impl true
  def handle_info({:alerts_changed, _id}, socket), do: {:noreply, load_alerts(socket)}
  def handle_info({:inbox_changed, _}, socket), do: {:noreply, load_alerts(socket)}
  def handle_info({:document_updated, _id}, socket), do: {:noreply, load_alerts(socket)}
  def handle_info(_msg, socket), do: {:noreply, socket}

  defp load_alerts(socket) do
    alerts = Alerts.list_alerts()

    socket
    |> assign(:alerts, alerts)
    |> assign(:count, length(alerts))
    |> assign(:urgentes, Enum.count(alerts, &urgente?/1))
    |> assign(:silenciadas, Enum.count(alerts, & &1.silenced))
  end

  defp toggle(set, key) do
    if MapSet.member?(set, key), do: MapSet.delete(set, key), else: MapSet.put(set, key)
  end

  defp urgente?(%{silenced: true}), do: false
  defp urgente?(%{dias: dias, threshold: threshold}), do: is_integer(dias) and dias <= threshold

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} active={:alertas} breadcrumbs={[%{label: "Alertas"}]}>
      <section class="sq-hero rounded-3xl p-6 sm:p-8">
        <p class="sq-eyebrow">Civio · Avisos de plazo</p>
        <h1 class="sq-display mt-2 text-3xl font-bold sm:text-4xl">Alertas por llamada</h1>
        <p class="mt-2 max-w-2xl text-[color:var(--sq-muted)]">
          Cuando a una reclamación le quedan pocos días, SQLete te avisa por SMS (o llamada).
          Aquí ves el histórico de avisos por expediente y puedes silenciar los que no quieras.
        </p>

        <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <.stat_card label="A reclamar" value={@count} accent="var(--sq-secondary)" />
          <.stat_card label="Urgentes (≤ umbral)" value={@urgentes} accent="#a32b1d" />
          <.stat_card label="Silenciadas" value={@silenciadas} accent="var(--sq-muted)" />
        </div>
      </section>

      <section class="sq-panel rounded-3xl p-5 sm:p-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="sq-eyebrow">Expedientes</p>
            <h2 class="sq-section-title text-xl font-semibold">{@count} con plazo de reclamación</h2>
          </div>
        </div>

        <div
          :if={@count == 0}
          class="mt-4 rounded-2xl border border-dashed border-[color:var(--sq-border)] p-8 text-center"
        >
          <p class="sq-section-title font-semibold">No hay expedientes a reclamar</p>
          <p class="mt-2 text-sm text-[color:var(--sq-muted)]">
            Cuando un expediente entre en plazo de reclamación aparecerá aquí.
          </p>
        </div>

        <div :if={@count > 0} class="mt-4 overflow-x-auto">
          <table class="sq-table min-w-full">
            <thead>
              <tr>
                <th class="whitespace-nowrap">Expediente</th>
                <th class="whitespace-nowrap">Asunto</th>
                <th class="whitespace-nowrap">Plazo</th>
                <th class="whitespace-nowrap">Último aviso</th>
                <th class="whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <%= for alert <- @alerts do %>
                <tr class={alert.silenced && "opacity-60"}>
                  <td class="font-semibold whitespace-nowrap">{alert.external_id}</td>
                  <td class="max-w-[16rem] truncate" title={alert.solicitud.asunto}>
                    {alert.solicitud.asunto}
                  </td>
                  <td>
                    <.semaforo
                      level={alert.solicitud.semaforo}
                      label={accion_plazo_label(alert.solicitud)}
                    />
                  </td>
                  <td class="whitespace-nowrap">
                    <.call_status call={alert.last_call} />
                  </td>
                  <td>
                    <div class="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        phx-click="test-notify"
                        phx-value-id={alert.external_id}
                        class="sq-button-secondary inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold"
                      >
                        <.icon name="hero-paper-airplane" class="size-3" /> Probar aviso
                      </button>

                      <button
                        :if={!alert.silenced}
                        type="button"
                        phx-click="silence"
                        phx-value-id={alert.external_id}
                        class="sq-button-secondary inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold"
                      >
                        <.icon name="hero-bell-slash" class="size-3" /> Silenciar
                      </button>
                      <button
                        :if={alert.silenced}
                        type="button"
                        phx-click="unsilence"
                        phx-value-id={alert.external_id}
                        class="sq-button-secondary inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold"
                      >
                        <.icon name="hero-bell" class="size-3" /> Reactivar
                      </button>

                      <button
                        :if={alert.calls != []}
                        type="button"
                        phx-click="toggle-history"
                        phx-value-id={alert.external_id}
                        class="inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--sq-muted)] hover:text-[color:var(--sq-primary)]"
                      >
                        <.icon name="hero-clock" class="size-3" />
                        {length(alert.calls)} {if length(alert.calls) == 1,
                          do: "aviso",
                          else: "avisos"}
                      </button>
                    </div>
                  </td>
                </tr>

                <tr :if={MapSet.member?(@expanded, alert.external_id)}>
                  <td colspan="5" class="bg-[color:var(--sq-secondary-soft)]">
                    <div class="p-3">
                      <p class="sq-eyebrow mb-2">Histórico de avisos</p>
                      <ul class="space-y-1">
                        <li
                          :for={call <- alert.calls}
                          class="flex flex-wrap items-center gap-3 rounded-xl bg-[color:var(--sq-surface)] px-3 py-2 text-sm"
                        >
                          <.channel_badge channel={call.channel} />
                          <.call_status call={call} />
                          <span class="text-[color:var(--sq-muted)]">
                            {fmt_datetime(call.inserted_at)}
                          </span>
                          <span :if={call.phone} class="text-[color:var(--sq-muted)]">
                            · {call.phone}
                          </span>
                          <span
                            :if={is_integer(call.dias_restantes)}
                            class="text-[color:var(--sq-muted)]"
                          >
                            · {fmt_dias(call.dias_restantes)} restantes
                          </span>
                          <span :if={call.error} class="text-[color:#a32b1d]">· {call.error}</span>
                        </li>
                      </ul>
                    </div>
                  </td>
                </tr>
              <% end %>
            </tbody>
          </table>
        </div>
      </section>
    </Layouts.app>
    """
  end

  attr :call, :any, required: true

  defp call_status(%{call: nil} = assigns) do
    ~H"""
    <span class="text-sm text-[color:var(--sq-muted)]">Sin avisos</span>
    """
  end

  defp call_status(assigns) do
    ~H"""
    <span class={["sq-badge", "sq-badge-#{call_level(@call.status)}"]}>
      <span class="sq-badge-dot" />
      {call_status_label(@call.status)}
    </span>
    """
  end

  attr :channel, :string, required: true

  defp channel_badge(assigns) do
    ~H"""
    <span class="sq-pill inline-flex items-center gap-1 text-[0.7rem] font-semibold">
      <.icon name={channel_icon(@channel)} class="size-3" /> {channel_label(@channel)}
    </span>
    """
  end

  defp channel_icon("sms"), do: "hero-chat-bubble-left-right"
  defp channel_icon(_call), do: "hero-phone"

  defp channel_label("sms"), do: "SMS"
  defp channel_label(_call), do: "Llamada"

  defp call_level("failed"), do: "rojo"
  defp call_level("undelivered"), do: "rojo"
  defp call_level("no_answer"), do: "ambar"
  defp call_level("no-answer"), do: "ambar"
  defp call_level(_status), do: "verde"

  defp call_status_label("queued"), do: "En cola"
  defp call_status_label("initiated"), do: "Iniciada"
  defp call_status_label("ringing"), do: "Llamando"
  defp call_status_label("in-progress"), do: "En curso"
  defp call_status_label("completed"), do: "Completada"
  defp call_status_label("answered"), do: "Contestada"
  defp call_status_label("no_answer"), do: "Sin respuesta"
  defp call_status_label("failed"), do: "Fallida"
  defp call_status_label("accepted"), do: "Aceptado"
  defp call_status_label("sending"), do: "Enviando"
  defp call_status_label("sent"), do: "Enviado"
  defp call_status_label("delivered"), do: "Entregado"
  defp call_status_label("undelivered"), do: "No entregado"
  defp call_status_label("receiving"), do: "Recibiendo"
  defp call_status_label(other), do: other

  defp fmt_datetime(%DateTime{} = dt) do
    "#{pad(dt.day)}/#{pad(dt.month)}/#{dt.year} #{pad(dt.hour)}:#{pad(dt.minute)}"
  end

  defp fmt_datetime(_), do: "—"

  defp pad(n) when n < 10, do: "0#{n}"
  defp pad(n), do: "#{n}"
end
