defmodule SQLeteWeb.SolicitudLive do
  @moduledoc """
  Detail view for a single expediente: estado, big deadline semáforo (countdown),
  request data, the timeline of notificaciones, and a link to the redistribution
  group when the expediente has children.
  """
  use SQLeteWeb, :live_view

  import SQLeteWeb.InboxComponents

  alias SQLete.Documents
  alias SQLete.Graph
  alias SQLete.Inbox
  alias SQLete.Inbox.CalendarExport

  @impl true
  def mount(%{"id" => id}, _session, socket) do
    if connected?(socket), do: Inbox.subscribe()
    sol = Inbox.get_solicitud!(id)
    graph_entities = Graph.list_entities_for_solicitud(sol.id)

    {:ok,
     socket
     |> assign(:page_title, sol.external_id)
     |> assign(:sol, sol)
     |> assign(:graph_entities, graph_entities)
     |> assign(:entity_search, "")
     |> assign(:show_pdf, false)}
  end

  @impl true
  def handle_info(msg, socket) when elem(msg, 0) in [:document_updated, :inbox_changed] do
    sol = Inbox.get_solicitud!(socket.assigns.sol.id)

    {:noreply,
     socket
     |> assign(:sol, sol)
     |> assign(:graph_entities, Graph.list_entities_for_solicitud(sol.id))}
  rescue
    Ecto.NoResultsError ->
      {:noreply,
       socket
       |> put_flash(:info, "Este expediente ya no existe.")
       |> push_navigate(to: ~p"/")}
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  @impl true
  def handle_event("show_pdf", _params, socket), do: {:noreply, assign(socket, :show_pdf, true)}

  def handle_event("hide_pdf", _params, socket), do: {:noreply, assign(socket, :show_pdf, false)}

  def handle_event("delete", _params, socket) do
    case Documents.delete_document(socket.assigns.sol.id) do
      {:ok, _doc} ->
        Inbox.broadcast({:inbox_changed, :deleted})

        {:noreply,
         socket
         |> put_flash(:info, "Expediente eliminado.")
         |> push_navigate(to: ~p"/")}

      {:error, _reason} ->
        {:noreply, put_flash(socket, :error, "No se pudo eliminar el expediente.")}
    end
  end

  def handle_event("search_entity", %{"entity_search" => q}, socket) do
    {:noreply, assign(socket, :entity_search, q)}
  end

  @impl true
  def render(assigns) do
    assigns =
      assigns
      |> assign(:recommended_action, recommended_action(assigns.sol))
      |> assign(:calendar_event, CalendarExport.event_for(assigns.sol))
      |> assign(
        :filtered_entities,
        filter_entities(assigns.graph_entities, assigns.entity_search)
      )

    ~H"""
    <Layouts.app
      flash={@flash}
      active={:inbox}
      breadcrumbs={[%{label: "Inbox", path: ~p"/"}, %{label: @sol.external_id}]}
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <.link
          navigate={~p"/"}
          class="sq-nav-link inline-flex items-center gap-1 text-sm font-semibold"
        >
          <.icon name="hero-arrow-left" class="size-4" /> Volver a la bandeja
        </.link>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            phx-click="show_pdf"
            class="sq-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
          >
            <.icon name="hero-document-magnifying-glass" class="size-4" /> Ver PDF
          </button>
          <button
            type="button"
            phx-click="delete"
            data-confirm="¿Eliminar este expediente y su PDF? Esta acción no se puede deshacer."
            class="inline-flex items-center gap-2 rounded-full border border-[#a32b1d] px-4 py-2 text-sm font-semibold text-[#a32b1d] transition hover:bg-[rgba(163,43,29,0.08)]"
          >
            <.icon name="hero-trash" class="size-4" /> Eliminar
          </button>
        </div>
      </div>

      <section class="sq-hero rounded-3xl p-6 sm:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="sq-eyebrow">{@sol.ambito} · {@sol.organismo}</p>
            <h1 class="sq-display mt-1 text-3xl font-bold">{@sol.external_id}</h1>
            <p class="mt-2 max-w-2xl text-[color:var(--sq-muted)]">{@sol.asunto}</p>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <.estado_badge estado={@sol.estado} />
              <.semaforo level={@sol.semaforo} dias={@sol.dias_para_reclamar} />
            </div>
          </div>

          <div class={[
            "sq-stat-card min-w-[12rem] rounded-2xl p-5 text-center",
            "sq-badge-#{@sol.semaforo}"
          ]}>
            <p class="sq-card-label">Plazo de reclamación</p>
            <p class="sq-display mt-1 text-3xl font-bold">{fmt_dias(@sol.dias_para_reclamar)}</p>
            <p class="mt-1 text-xs text-[color:var(--sq-muted)]">
              Límite CTBG: {fmt_date(@sol.fecha_limite_reclamacion_ctbg)}
            </p>
          </div>
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <section class="sq-panel rounded-3xl p-5 sm:p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p class="sq-eyebrow">Acción recomendada</p>
                <h2 class="sq-section-title text-xl font-semibold">{@recommended_action.title}</h2>
                <p class="mt-2 text-sm text-[color:var(--sq-muted)]">{@recommended_action.body}</p>
              </div>
              <span class={[
                "sq-estado whitespace-nowrap",
                "sq-estado-#{@recommended_action.variant}"
              ]}>
                {estado_label(@sol.estado)}
              </span>
            </div>
            <a
              :if={@calendar_event}
              id="calendar-export"
              href={CalendarExport.data_uri(@calendar_event)}
              download={@calendar_event.filename}
              class="sq-button-secondary mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
            >
              <.icon name="hero-calendar-days" class="size-4" /> Exportar a Calendar
            </a>
          </section>

          <section class="sq-panel rounded-3xl p-5 sm:p-6">
            <p class="sq-eyebrow">Cronología de notificaciones</p>
            <h2 class="sq-section-title text-xl font-semibold">Timeline</h2>

            <ol class="sq-timeline mt-5 space-y-5">
              <li :for={notif <- @sol.notificaciones || []} class="relative">
                <span class="sq-timeline-dot" />
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <p class="font-semibold">{estado_label(notif.tipo)}</p>
                  <span class="text-sm text-[color:var(--sq-muted)]">
                    {fmt_date(notif.fecha_notificacion)}
                  </span>
                </div>
                <p :if={notif[:llm_confidence]} class="text-xs text-[color:var(--sq-muted)]">
                  Confianza IA: {round(notif.llm_confidence * 100)}%
                </p>
              </li>
              <li :if={(@sol.notificaciones || []) == []} class="text-sm text-[color:var(--sq-muted)]">
                Sin notificaciones registradas.
              </li>
            </ol>
          </section>

          <section class="sq-panel rounded-3xl p-5 sm:p-6">
            <p class="sq-eyebrow">Motor de plazos</p>
            <h2 class="sq-section-title text-xl font-semibold">Cálculo del plazo</h2>
            <p class="mt-2 text-sm text-[color:var(--sq-muted)]">
              Así se calcula el plazo de reclamación según la Ley 19/2013 de transparencia.
            </p>

            <div class="sq-deadline-chain mt-5">
              <.chain_step
                label="Inicio tramitación"
                value={fmt_date(@sol.inicio_tramitacion)}
                description="Arranca el reloj legal"
                active={@sol.inicio_tramitacion != nil}
              />
              <.chain_arrow />
              <.chain_step
                label="Vencimiento normal"
                value={fmt_date(vencimiento_normal(@sol))}
                description="Inicio + 1 mes (art. 20)"
                active={@sol.inicio_tramitacion != nil}
              />
              <%= if @sol.prorroga_20_1 do %>
                <.chain_arrow />
                <.chain_step
                  label="Prórroga art. 20.1"
                  value={fmt_date(@sol.prorroga_20_1)}
                  description="Volumen/complejidad"
                  active={true}
                  highlight={true}
                />
              <% end %>
              <.chain_arrow />
              <.chain_step
                label="Vencimiento efectivo"
                value={fmt_date(@sol.vencimiento_efectivo)}
                description={if @sol.prorroga_20_1, do: "Inicio + 2 meses", else: "Inicio + 1 mes"}
                active={@sol.vencimiento_efectivo != nil}
                highlight={true}
              />
              <%= if @sol.resolucion do %>
                <.chain_arrow />
                <.chain_step
                  label="Resolución"
                  value={fmt_date(@sol.resolucion)}
                  description="Respuesta de la administración"
                  active={true}
                />
              <% end %>
              <%= if @sol.notificacion do %>
                <.chain_arrow />
                <.chain_step
                  label="Notificación"
                  value={fmt_date(@sol.notificacion)}
                  description="Recepción formal"
                  active={true}
                />
              <% end %>
              <.chain_arrow />
              <.chain_step
                label="Límite CTBG"
                value={fmt_date(@sol.fecha_limite_reclamacion_ctbg)}
                description="Último día para reclamar"
                active={@sol.fecha_limite_reclamacion_ctbg != nil}
                danger={true}
              />
            </div>

            <div class="mt-5 rounded-xl bg-[color:var(--sq-secondary-soft)] p-4 text-sm">
              <p class="font-semibold">Silencio negativo (art. 20.4)</p>
              <p class="mt-1 text-[color:var(--sq-muted)]">
                Si la administración no responde en plazo, se entiende denegado por silencio
                administrativo. Tienes 1 mes desde el vencimiento para reclamar al CTBG.
              </p>
            </div>
          </section>

          <section :if={@sol.children_count > 0} class="sq-panel rounded-3xl p-5 sm:p-6">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="sq-eyebrow">Redistribución</p>
                <h2 class="sq-section-title text-xl font-semibold">Subexpedientes redistribuidos</h2>
              </div>
              <.link
                navigate={~p"/redistribucion"}
                class="sq-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
              >
                <.icon name="hero-rectangle-stack" class="size-4" /> Ver grupo
              </.link>
            </div>

            <div class="mt-5 divide-y divide-[color:var(--sq-border)]">
              <.link
                :for={child <- @sol.children || []}
                navigate={~p"/inbox/#{child.id}"}
                class="block py-4 transition hover:bg-[color:var(--sq-primary-soft)] sm:px-3"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p class="font-semibold">{child.external_id}</p>
                    <p class="text-sm text-[color:var(--sq-muted)]">{child.organismo}</p>
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <.estado_badge estado={child.estado} />
                    <.semaforo level={child.semaforo} dias={child.dias_para_reclamar} />
                  </div>
                </div>
              </.link>
            </div>
          </section>
        </div>

        <div class="space-y-6">
          <section class="sq-panel rounded-3xl p-5 sm:p-6 h-fit">
            <p class="sq-eyebrow">Datos del expediente</p>
            <h2 class="sq-section-title text-xl font-semibold">Detalle</h2>

            <dl class="mt-4 space-y-3 text-sm">
              <.field label="Fecha solicitud" value={fmt_date(@sol.fecha_solicitud)} />
              <.field label="Inicio tramitación" value={fmt_date(@sol.inicio_tramitacion)} />
              <.field label="Prórroga art. 20.1" value={fmt_date(@sol.prorroga_20_1)} />
              <.field label="Vencimiento efectivo" value={fmt_date(@sol.vencimiento_efectivo)} />
              <.field label="Resolución" value={fmt_date(@sol.resolucion)} />
              <.field label="Notificación" value={fmt_date(@sol.notificacion)} />
              <.field label="Autor" value={@sol.autor} />
              <.field
                :if={@sol.reclamacion_ref}
                label="Reclamación CTBG"
                value={@sol.reclamacion_ref}
              />
            </dl>

            <p
              :if={@sol.notas}
              class="mt-4 rounded-xl bg-[color:var(--sq-secondary-soft)] p-3 text-sm"
            >
              {@sol.notas}
            </p>

            <div
              :if={@sol.parent}
              class="mt-4 rounded-xl bg-[color:var(--sq-primary-soft)] p-3 text-sm"
            >
              <p class="sq-eyebrow">Expediente padre</p>
              <.link
                navigate={~p"/inbox/#{@sol.parent.id}"}
                class="mt-1 inline-flex items-center gap-2 font-semibold text-[color:var(--sq-primary)]"
              >
                <.icon name="hero-arrow-uturn-left" class="size-4" />
                {@sol.parent.external_id}
              </.link>
              <p class="mt-1 text-[color:var(--sq-muted)]">{@sol.parent.organismo}</p>
            </div>

            <.link
              :if={@sol.children_count >= 3}
              navigate={~p"/redistribucion"}
              class="sq-button-secondary mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
            >
              <.icon name="hero-rectangle-stack" class="size-4" />
              1 solicitud → {@sol.children_count} expedientes
            </.link>
          </section>

          <section :if={@graph_entities != []} class="sq-panel rounded-3xl p-5 sm:p-6">
            <p class="sq-eyebrow">Grafo de conocimiento</p>
            <h2 class="sq-section-title text-xl font-semibold">Entidades relacionadas</h2>

            <div class="relative mt-4">
              <.icon
                name="hero-magnifying-glass"
                class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--sq-muted)]"
              />
              <input
                type="text"
                name="entity_search"
                phx-input="search_entity"
                value={@entity_search}
                placeholder="Buscar entidad..."
                class="w-full rounded-xl border border-[color:var(--sq-border)] bg-[color:var(--sq-surface,transparent)] py-2 pl-9 pr-3 text-sm outline-none transition focus:border-[color:var(--sq-primary)]"
              />
            </div>

            <div class="mt-4 divide-y divide-[color:var(--sq-border)]">
              <.link
                :for={entity <- @filtered_entities}
                navigate={~p"/entities/#{entity.id}"}
                class="flex items-center justify-between gap-3 py-3 transition hover:bg-[color:var(--sq-primary-soft)] sm:px-2"
              >
                <div class="min-w-0">
                  <p class="truncate font-semibold">{entity.name}</p>
                  <p class="text-xs text-[color:var(--sq-muted)]">{Graph.type_label(entity.type)}</p>
                </div>
                <.icon name="hero-arrow-right" class="size-4 shrink-0 text-[color:var(--sq-muted)]" />
              </.link>
            </div>
          </section>
        </div>
      </div>

      <div
        :if={@show_pdf}
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        phx-click="hide_pdf"
        phx-window-keydown="hide_pdf"
        phx-key="escape"
      >
        <div
          class="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[color:var(--sq-surface,white)] shadow-2xl"
          onclick="event.stopPropagation()"
        >
          <div class="flex items-center justify-between gap-3 border-b border-[color:var(--sq-border)] px-5 py-3">
            <p class="truncate font-semibold">{@sol.external_id}</p>
            <div class="flex items-center gap-2">
              <.link
                href={~p"/documents/#{@sol.id}/pdf"}
                target="_blank"
                class="sq-button-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold"
              >
                <.icon name="hero-arrow-top-right-on-square" class="size-4" /> Abrir en nueva pestaña
              </.link>
              <button
                type="button"
                phx-click="hide_pdf"
                class="inline-flex items-center justify-center rounded-full p-1.5 text-[color:var(--sq-muted)] transition hover:bg-[color:var(--sq-primary-soft)]"
                aria-label="Cerrar"
              >
                <.icon name="hero-x-mark" class="size-5" />
              </button>
            </div>
          </div>
          <iframe
            src={~p"/documents/#{@sol.id}/pdf"}
            class="h-full w-full flex-1"
            title="PDF del expediente"
          >
          </iframe>
        </div>
      </div>
    </Layouts.app>
    """
  end

  attr :label, :string, required: true
  attr :value, :any, required: true

  defp field(assigns) do
    ~H"""
    <div class="flex items-center justify-between gap-3">
      <dt class="text-[color:var(--sq-muted)]">{@label}</dt>
      <dd class="font-medium">{@value}</dd>
    </div>
    """
  end

  defp recommended_action(sol) do
    case sol.estado do
      :a_reclamar_silencio ->
        %{
          title: "Reclamar al CTBG por silencio administrativo",
          body:
            "La administración no ha respondido en plazo. Según el art. 20.4 de la Ley 19/2013, se entiende denegado por silencio negativo. Tenéis 1 mes desde el vencimiento para presentar reclamación ante el Consejo de Transparencia.",
          variant: "danger"
        }

      :a_reclamar_incompleta ->
        %{
          title: "Reclamar por respuesta incompleta",
          body:
            "La administración respondió pero falta información relevante. Revisad qué documentos o datos faltan y preparad una reclamación al CTBG argumentando la insuficiencia de la respuesta.",
          variant: "danger"
        }

      :reclamada ->
        %{
          title: "Seguimiento de reclamación ante el CTBG",
          body:
            "La reclamación ya está registrada con referencia CTBG. Próximo paso: esperar resolución del Consejo y registrar cualquier comunicación nueva que llegue.",
          variant: "warn"
        }

      :ganado_sin_info ->
        %{
          title: "Exigir cumplimiento de resolución favorable",
          body:
            "El CTBG os dio la razón pero la administración aún no ha entregado la información. Tocaría enviar un requerimiento de cumplimiento o escalar por la vía contencioso-administrativa.",
          variant: "done"
        }

      :resuelta ->
        %{
          title: "Archivar y analizar documentación recibida",
          body:
            "El expediente está resuelto y la información recibida. Revisad que los documentos estén completos, incorporadlos al análisis periodístico y cerrad el expediente.",
          variant: "done"
        }

      _ ->
        %{
          title: "Esperar respuesta dentro de plazo",
          body:
            "La solicitud sigue en trámite. La administración tiene hasta el vencimiento efectivo para responder. Si no lo hace, se activará el silencio negativo y podréis reclamar.",
          variant: "info"
        }
    end
  end

  defp vencimiento_normal(sol) do
    if sol.inicio_tramitacion do
      add_months(sol.inicio_tramitacion, 1)
    end
  end

  defp add_months(%Date{} = date, n) do
    months = date.year * 12 + (date.month - 1) + n
    year = div(months, 12)
    month = rem(months, 12) + 1
    day = min(date.day, Date.days_in_month(%Date{year: year, month: month, day: 1}))
    Date.new!(year, month, day)
  end

  attr :label, :string, required: true
  attr :value, :string, required: true
  attr :description, :string, required: true
  attr :active, :boolean, default: false
  attr :highlight, :boolean, default: false
  attr :danger, :boolean, default: false

  defp chain_step(assigns) do
    ~H"""
    <div class={[
      "sq-chain-step rounded-xl border p-3",
      @active && "border-[color:var(--sq-secondary)]",
      !@active && "border-dashed border-[color:var(--sq-border)] opacity-50",
      @highlight && "bg-[color:var(--sq-secondary-soft)]",
      @danger && "border-[#a32b1d] bg-[rgba(163,43,29,0.08)]"
    ]}>
      <p class="text-xs font-semibold uppercase text-[color:var(--sq-muted)]">{@label}</p>
      <p class="mt-1 text-lg font-bold">{@value}</p>
      <p class="mt-1 text-xs text-[color:var(--sq-muted)]">{@description}</p>
    </div>
    """
  end

  defp chain_arrow(assigns) do
    ~H"""
    <div class="sq-chain-arrow flex items-center justify-center py-1">
      <.icon name="hero-arrow-down" class="size-4 text-[color:var(--sq-muted)]" />
    </div>
    """
  end

  defp filter_entities(entities, ""), do: entities

  defp filter_entities(entities, query) do
    q = String.downcase(query)
    Enum.filter(entities, fn e -> String.contains?(String.downcase(e.name), q) end)
  end
end
