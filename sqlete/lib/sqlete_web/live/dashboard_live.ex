defmodule SQLeteWeb.DashboardLive do
  @moduledoc """
  Main inbox dashboard: stat cards, filters, the list of expedientes with deadline
  semáforo, and the drag & drop PDF upload that feeds `Documents.ingest_pdf/2`.
  """
  use SQLeteWeb, :live_view

  import SQLeteWeb.InboxComponents

  alias SQLete.Documents
  alias SQLete.Inbox
  alias SQLete.Inbox.Digest

  @max_upload_size 25_000_000
  @max_upload_entries 20
  # Fallback polling while freshly-uploaded PDFs are processed by the workers.
  @upload_poll_ticks 12
  @upload_poll_interval_ms 1_500

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket), do: Inbox.subscribe()

    all = Inbox.list_solicitudes()

    socket =
      socket
      |> assign(:page_title, "Inbox")
      |> assign(:filters, default_filters())
      |> assign(:filter_options, filter_options(all))
      |> assign(:stats, Inbox.dashboard_stats())
      |> assign(:count, length(all))
      |> assign(:digest_groups, Digest.grouped(all))
      |> assign(:digest_text, Digest.to_text(all))
      |> assign(:sort, %{by: nil, dir: :asc})
      |> assign(:processing, false)
      |> assign(:pending_count, 0)
      |> assign(:batch_total, 0)
      |> assign(:extraction_result, nil)
      |> assign(:upload_history, [])
      |> allow_upload(:pdf,
        accept: ~w(.pdf application/pdf),
        max_entries: @max_upload_entries,
        max_file_size: @max_upload_size
      )
      |> stream(:solicitudes, all)

    {:ok, socket}
  end

  @impl true
  def handle_event("filter", params, socket) do
    filters = Map.take(params, ["estado", "autor", "ambito", "q", "urgencia"])
    {:noreply, restream(socket, filters, socket.assigns.sort)}
  end

  def handle_event("clear-filters", _params, socket) do
    {:noreply, restream(socket, default_filters(), socket.assigns.sort)}
  end

  def handle_event("sort", %{"by" => col}, socket) do
    sort = next_sort(socket.assigns.sort, col)
    {:noreply, restream(socket, socket.assigns.filters, sort)}
  end

  def handle_event("validate", _params, socket) do
    {:noreply, socket}
  end

  def handle_event("cancel-upload", %{"ref" => ref}, socket) do
    {:noreply, cancel_upload(socket, :pdf, ref)}
  end

  def handle_event("save", _params, socket) do
    results =
      consume_uploaded_entries(socket, :pdf, fn %{path: path}, entry ->
        # consume_uploaded_entries unwraps the outer {:ok, _}, so wrap the real
        # ingest result inside it to inspect {:ok, doc} / {:error, reason} below.
        ingest =
          case File.read(path) do
            {:ok, binary} ->
              Documents.ingest_pdf(binary,
                filename: entry.client_name,
                content_type: "application/pdf"
              )

            {:error, reason} ->
              {:error, reason}
          end

        {:ok, ingest}
      end)

    ok_count = Enum.count(results, &match?({:ok, _}, &1))
    err_count = length(results) - ok_count

    if ok_count > 0 do
      # Each PDF is stored and gets its own async worker; every worker broadcasts
      # {:document_updated, id} on completion. We count those down and poll as a
      # fallback. Real extraction results are shown as each one finishes.
      schedule_upload_poll(socket.assigns.count, @upload_poll_ticks)

      socket =
        socket
        |> assign(:processing, true)
        |> assign(:pending_count, ok_count)
        |> assign(:batch_total, ok_count)
        |> put_flash(:info, upload_flash(ok_count, err_count))

      {:noreply, socket}
    else
      {:noreply,
       socket
       |> assign(:processing, false)
       |> put_flash(:error, "No se pudo procesar ningún PDF.")}
    end
  end

  def handle_event("dismiss-extraction", _params, socket) do
    {:noreply, assign(socket, :extraction_result, nil)}
  end

  @impl true
  def handle_info({:document_updated, id}, socket) do
    if socket.assigns.processing do
      {:noreply, record_processed(socket, safe_get_solicitud(id))}
    else
      {:noreply, refresh(socket)}
    end
  end

  def handle_info({:inbox_changed, _}, socket), do: {:noreply, refresh(socket)}

  def handle_info({:poll_upload, count_before, ticks}, socket) do
    if socket.assigns.processing do
      socket = refresh(socket)
      target = count_before + socket.assigns.batch_total

      cond do
        # Fallback path (broadcasts missed): the table is already refreshed above;
        # once every uploaded row shows up, stop the spinner.
        socket.assigns.count >= target ->
          {:noreply, finish_batch(socket)}

        ticks <= 0 ->
          {:noreply, finish_batch(socket)}

        true ->
          schedule_upload_poll(count_before, ticks - 1)
          {:noreply, socket}
      end
    else
      {:noreply, socket}
    end
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  defp schedule_upload_poll(count_before, ticks) do
    Process.send_after(self(), {:poll_upload, count_before, ticks}, @upload_poll_interval_ms)
  end

  defp upload_flash(ok_count, 0),
    do: "#{count_label(ok_count)}. Procesando con IA… se añadirán a la tabla al terminar."

  defp upload_flash(ok_count, err_count),
    do: "#{count_label(ok_count)} en proceso · #{err_count} no se pudieron leer."

  defp count_label(1), do: "1 PDF recibido"
  defp count_label(n), do: "#{n} PDFs recibidos"

  # Builds the (real) extraction result card from the freshly-ingested solicitud
  # and records it in the session history. Called once per finished document in
  # the batch.
  defp record_processed(socket, nil), do: socket |> refresh() |> maybe_finish_batch()

  defp record_processed(socket, sol) do
    extraction = build_extraction_result(sol)

    entry = %{
      id: System.unique_integer([:positive]),
      filename: sol.external_id || sol.asunto || "documento.pdf",
      result: extraction,
      timestamp: DateTime.utc_now()
    }

    socket
    |> refresh()
    |> assign(:extraction_result, extraction)
    |> assign(:upload_history, [entry | socket.assigns.upload_history])
    |> maybe_finish_batch()
  end

  # One async worker finished: count it down and stop the spinner once the whole
  # batch is in.
  defp maybe_finish_batch(socket) do
    pending = max(0, socket.assigns.pending_count - 1)

    socket
    |> assign(:pending_count, pending)
    |> assign(:processing, pending > 0)
  end

  defp finish_batch(socket) do
    socket
    |> assign(:processing, false)
    |> assign(:pending_count, 0)
  end

  defp safe_get_solicitud(id) do
    Inbox.get_solicitud!(id)
  rescue
    _ -> nil
  end

  defp build_extraction_result(sol) do
    confianza = extraction_confidence(sol)

    %{
      tipo: to_string(sol.estado),
      tipo_label: estado_label(sol.estado),
      organismo: sol.organismo || "—",
      expediente_id: sol.external_id,
      fecha_notificacion: sol.notificacion,
      fecha_inicio_tramitacion: sol.inicio_tramitacion,
      confianza: confianza,
      requiere_revision: confianza < 0.8
    }
  end

  # No real per-field score yet: use extraction completeness as a confidence proxy.
  defp extraction_confidence(sol) do
    fields = [sol.organismo, sol.asunto, sol.external_id, sol.fecha_solicitud, sol.resolucion]
    present = Enum.count(fields, &(&1 not in [nil, "", "—"]))
    Float.round(0.6 + 0.4 * present / length(fields), 2)
  end

  defp refresh(socket) do
    all = Inbox.list_solicitudes()

    socket
    |> assign(:stats, Inbox.dashboard_stats())
    |> assign(:digest_groups, Digest.grouped(all))
    |> assign(:digest_text, Digest.to_text(all))
    |> restream(socket.assigns.filters, socket.assigns.sort)
  end

  # Fetch (source-level filters) → urgency filter + sort in memory → stream.
  defp restream(socket, filters, sort) do
    arranged =
      filters
      |> source_filters()
      |> Inbox.list_solicitudes()
      |> arrange(filters, sort)

    socket
    |> assign(:filters, filters)
    |> assign(:sort, sort)
    |> assign(:count, length(arranged))
    |> stream(:solicitudes, arranged, reset: true)
  end

  defp source_filters(filters), do: Map.take(filters, ["estado", "autor", "ambito", "q"])

  defp arrange(sols, filters, sort) do
    sols
    |> filter_urgencia(filters["urgencia"])
    |> sort_solicitudes(sort)
  end

  defp filter_urgencia(sols, urg) when urg in ["rojo", "ambar", "verde"] do
    level = String.to_existing_atom(urg)
    Enum.filter(sols, &(&1.semaforo == level))
  end

  defp filter_urgencia(sols, _urg), do: sols

  defp sort_solicitudes(sols, %{by: nil}), do: sols

  defp sort_solicitudes(sols, %{by: col, dir: dir}) do
    Enum.sort_by(sols, &sort_value(&1, col), sorter(dir))
  end

  defp sort_value(sol, "asunto"), do: to_string(sol.asunto)
  defp sort_value(sol, "organismo"), do: to_string(sol.organismo)
  defp sort_value(sol, "estado"), do: estado_label(sol.estado)
  defp sort_value(sol, "autor"), do: to_string(sol.autor)
  defp sort_value(sol, "dias"), do: sort_dias(sol)
  defp sort_value(sol, _col), do: to_string(sol.external_id)

  defp sort_dias(sol) do
    cond do
      is_integer(sol.dias_para_reclamar) -> sol.dias_para_reclamar
      is_integer(sol.dias_para_vencer) -> sol.dias_para_vencer
      true -> 999_999
    end
  end

  defp sorter(:desc), do: &>=/2
  defp sorter(_asc), do: &<=/2

  defp next_sort(%{by: same, dir: :asc}, same), do: %{by: same, dir: :desc}
  defp next_sort(%{by: same}, same), do: %{by: same, dir: :asc}
  defp next_sort(_sort, col), do: %{by: col, dir: :asc}

  defp digest_total(groups), do: groups |> Enum.map(& &1.count) |> Enum.sum()

  defp default_filters,
    do: %{"estado" => "", "autor" => "", "ambito" => "", "q" => "", "urgencia" => ""}

  defp filter_options(all) do
    %{
      estado:
        all
        |> Enum.map(&{estado_label(&1.estado), to_string(&1.estado)})
        |> Enum.uniq()
        |> Enum.sort(),
      autor: all |> Enum.map(& &1.autor) |> Enum.reject(&is_nil/1) |> Enum.uniq() |> Enum.sort(),
      ambito: all |> Enum.map(& &1.ambito) |> Enum.reject(&is_nil/1) |> Enum.uniq() |> Enum.sort()
    }
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} active={:inbox} breadcrumbs={[%{label: "Inbox"}]}>
      <section class="sq-hero rounded-3xl p-6 sm:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="sq-eyebrow">Civio · Derecho de acceso</p>
            <h1 class="sq-display mt-2 text-3xl font-bold sm:text-4xl">Bandeja de expedientes</h1>
            <p class="mt-2 max-w-2xl text-[color:var(--sq-muted)]">
              Arrastra el PDF de una notificación y SQLete lo interpreta, calcula los plazos solos
              y te avisa de lo que vence.
            </p>
          </div>

          <.link
            id="redistribution-cta"
            navigate={~p"/redistribucion"}
            class="sq-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
          >
            <.icon name="hero-rectangle-stack" class="size-4" /> Ver redistribución
          </.link>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <.stat_card label="Expedientes" value={@stats.total} accent="var(--sq-secondary)" />
          <.stat_card label="Urgentes" value={@stats.urgentes} accent="var(--sq-primary)" />
          <.stat_card label="A reclamar" value={@stats.a_reclamar} accent="#a32b1d" />
          <.stat_card label="En plazo" value={@stats.en_plazo} accent="#1f7a4d" />
        </div>
      </section>

      <section class="sq-panel rounded-3xl p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="sq-eyebrow">Digest de hoy</p>
            <h2 class="sq-section-title text-xl font-semibold">Prioridad para revisar</h2>
          </div>
          <div class="flex items-center gap-2">
            <span class="sq-pill text-sm font-semibold">{digest_total(@digest_groups)} avisos</span>
            <button
              id="copy-digest"
              type="button"
              phx-hook=".CopyDigest"
              data-target="#digest-text"
              class="sq-button-secondary inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
            >
              <.icon name="hero-clipboard-document" class="size-4" />
              <span data-label>Copiar digest</span>
            </button>
          </div>
        </div>

        <div class="mt-4 grid gap-3 lg:grid-cols-3">
          <div
            :for={group <- @digest_groups}
            id={"digest-group-#{group.key}"}
            class="rounded-2xl border border-[color:var(--sq-border)]"
          >
            <div class="flex items-center gap-2 border-b border-[color:var(--sq-border)] p-3">
              <span>{group.emoji}</span>
              <div class="min-w-0">
                <p class="truncate font-semibold">{group.title}</p>
                <p class="truncate text-xs text-[color:var(--sq-muted)]">{group.subtitle}</p>
              </div>
              <span class="ml-auto text-lg font-bold">{group.count}</span>
            </div>

            <div class="max-h-72 space-y-1 overflow-y-auto p-2">
              <p
                :if={group.items == []}
                class="px-2 py-6 text-center text-sm text-[color:var(--sq-muted)]"
              >
                Sin expedientes en esta categoría
              </p>
              <.link
                :for={sol <- group.items}
                id={"digest-#{sol.id}"}
                navigate={~p"/inbox/#{sol.id}"}
                class="block rounded-xl p-2 transition hover:bg-[color:var(--sq-primary-soft)]"
              >
                <p class="truncate text-sm font-semibold">{sol.external_id}</p>
                <p class="line-clamp-1 text-xs text-[color:var(--sq-muted)]">{sol.asunto}</p>
                <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-[color:var(--sq-muted)]">
                  <span>{sol.autor}</span>
                  <span>·</span>
                  <span class="truncate">{sol.ambito}</span>
                  <span class="ml-auto">
                    <.semaforo
                      :if={group.key == :a_reclamar}
                      level={sol.semaforo}
                      label={accion_plazo_label(sol)}
                    />
                    <span :if={group.key != :a_reclamar}>{sol.reclamacion_ref || "—"}</span>
                  </span>
                </div>
              </.link>
            </div>
          </div>
        </div>

        <textarea id="digest-text" class="sr-only" readonly>{@digest_text}</textarea>

        <script :type={Phoenix.LiveView.ColocatedHook} name=".CopyDigest">
          export default {
            mounted() {
              this.el.addEventListener("click", () => this.copy())
            },
            async copy() {
              const target = document.querySelector(this.el.dataset.target)
              const text = target ? target.value : ""
              let ok = false
              try {
                if (navigator.clipboard && window.isSecureContext) {
                  await navigator.clipboard.writeText(text)
                  ok = true
                } else if (target) {
                  target.classList.remove("sr-only")
                  target.select()
                  ok = document.execCommand("copy")
                  target.classList.add("sr-only")
                }
              } catch (_e) {
                ok = false
              }
              this.feedback(ok)
            },
            feedback(ok) {
              const label = this.el.querySelector("[data-label]") || this.el
              const prev = label.textContent
              label.textContent = ok ? "¡Copiado!" : "Copia manual"
              setTimeout(() => { label.textContent = prev }, 2000)
            }
          }
        </script>
      </section>

      <.upload_panel
        uploads={@uploads}
        processing={@processing}
        pending_count={@pending_count}
        batch_total={@batch_total}
        extraction_result={@extraction_result}
        upload_history={@upload_history}
      />

      <section class="sq-panel rounded-3xl p-5 sm:p-6">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="sq-eyebrow">Expedientes</p>
            <h2 class="sq-section-title text-xl font-semibold">{@count} resultados</h2>
          </div>

          <form phx-change="filter" class="flex flex-wrap items-center gap-2" id="filters-form">
            <input
              type="search"
              name="q"
              value={@filters["q"]}
              placeholder="Buscar…"
              class="rounded-full border border-[color:var(--sq-border)] bg-transparent px-4 py-2 text-sm"
            />
            <.filter_select
              name="estado"
              value={@filters["estado"]}
              options={@filter_options.estado}
              prompt="Estado"
            />
            <.filter_select
              name="autor"
              value={@filters["autor"]}
              options={@filter_options.autor}
              prompt="Autor"
            />
            <.filter_select
              name="ambito"
              value={@filters["ambito"]}
              options={@filter_options.ambito}
              prompt="Ámbito"
            />
            <.filter_select
              name="urgencia"
              value={@filters["urgencia"]}
              options={[{"Urgente", "rojo"}, {"Atención", "ambar"}, {"En plazo", "verde"}]}
              prompt="Urgencia"
            />
          </form>
        </div>

        <div class="mt-4 overflow-x-auto">
          <table class="sq-table min-w-full">
            <thead>
              <tr>
                <th class="whitespace-nowrap">
                  <.sort_th label="Expediente" col="expediente" sort={@sort} />
                </th>
                <th class="whitespace-nowrap">
                  <.sort_th label="Asunto" col="asunto" sort={@sort} />
                </th>
                <th class="hidden whitespace-nowrap sm:table-cell">
                  <.sort_th label="Organismo" col="organismo" sort={@sort} />
                </th>
                <th class="whitespace-nowrap">Grupo</th>
                <th class="whitespace-nowrap">
                  <.sort_th label="Estado" col="estado" sort={@sort} />
                </th>
                <th class="whitespace-nowrap">Plazo</th>
                <th class="whitespace-nowrap"><.sort_th label="Días" col="dias" sort={@sort} /></th>
                <th class="hidden whitespace-nowrap md:table-cell">
                  <.sort_th label="Autor" col="autor" sort={@sort} />
                </th>
              </tr>
            </thead>
            <tbody :if={@processing} id="upload-loading">
              <tr class="animate-pulse bg-[color:var(--sq-primary-soft)]">
                <td colspan="8" class="py-4 text-center">
                  <span class="inline-flex items-center gap-2 font-semibold text-[color:var(--sq-primary)]">
                    <.icon name="hero-arrow-path" class="size-4 animate-spin" />
                    Procesando {@batch_total} PDF(s) con IA… se añadirán a la tabla al terminar.
                  </span>
                </td>
              </tr>
            </tbody>
            <tbody id="solicitudes" phx-update="stream">
              <tr class="hidden only:table-row" id="empty-row">
                <td colspan="8" class="py-10 text-center text-[color:var(--sq-muted)]">
                  No hay expedientes que coincidan con el filtro.
                </td>
              </tr>
              <tr
                :for={{dom_id, sol} <- @streams.solicitudes}
                id={dom_id}
                phx-click={JS.navigate(~p"/inbox/#{sol.id}")}
              >
                <td class="font-semibold whitespace-nowrap">{sol.external_id}</td>
                <td class="max-w-[16rem] truncate sm:max-w-xs" title={sol.asunto}>{sol.asunto}</td>
                <td
                  class="hidden max-w-[14rem] truncate text-[color:var(--sq-muted)] sm:table-cell"
                  title={sol.organismo}
                >
                  {sol.organismo}
                </td>
                <td>
                  <span
                    :if={sol.children_count >= 3}
                    class="sq-pill inline-flex whitespace-nowrap text-[0.7rem] font-semibold"
                  >
                    1 → {sol.children_count}
                  </span>
                  <span :if={sol.children_count < 3} class="text-[color:var(--sq-muted)]">—</span>
                </td>
                <td><.estado_badge estado={sol.estado} /></td>
                <td><.semaforo level={sol.semaforo} label={accion_plazo_label(sol)} /></td>
                <td class="font-semibold whitespace-nowrap" style={"color: #{dias_column_color(sol)}"}>
                  {dias_column_label(sol)}
                </td>
                <td class="hidden text-[color:var(--sq-muted)] md:table-cell">{sol.autor}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          :if={@count == 0}
          class="mt-4 rounded-2xl border border-dashed border-[color:var(--sq-border)] p-8 text-center"
        >
          <p class="sq-section-title font-semibold">Sin resultados para esos filtros</p>
          <p class="mt-2 text-sm text-[color:var(--sq-muted)]">
            Prueba quitando la búsqueda o combinando menos criterios.
          </p>
          <button
            id="clear-filters"
            type="button"
            phx-click="clear-filters"
            class="sq-button-secondary mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
          >
            <.icon name="hero-x-mark" class="size-4" /> Limpiar filtros
          </button>
        </div>
      </section>
    </Layouts.app>
    """
  end

  attr :name, :string, required: true
  attr :value, :string, required: true
  attr :options, :list, required: true
  attr :prompt, :string, required: true

  defp filter_select(assigns) do
    ~H"""
    <select
      name={@name}
      class="rounded-full border border-[color:var(--sq-border)] bg-transparent px-4 py-2 text-sm"
    >
      <option value="">{@prompt}</option>
      <option :for={opt <- @options} value={option_value(opt)} selected={option_value(opt) == @value}>
        {option_label(opt)}
      </option>
    </select>
    """
  end

  attr :label, :string, required: true
  attr :col, :string, required: true
  attr :sort, :map, required: true

  defp sort_th(assigns) do
    ~H"""
    <button
      type="button"
      phx-click="sort"
      phx-value-by={@col}
      class="inline-flex items-center gap-1 font-semibold uppercase"
    >
      {@label}
      <span :if={@sort.by == @col} aria-hidden="true">
        {if @sort.dir == :asc, do: "▲", else: "▼"}
      </span>
    </button>
    """
  end

  defp option_value({_label, value}), do: value
  defp option_value(value), do: value
  defp option_label({label, _value}), do: label
  defp option_label(value), do: value

  attr :uploads, :map, required: true
  attr :processing, :boolean, required: true
  attr :pending_count, :integer, required: true
  attr :batch_total, :integer, required: true
  attr :extraction_result, :any, required: true
  attr :upload_history, :list, required: true

  defp upload_panel(assigns) do
    ~H"""
    <section class="sq-panel rounded-3xl p-5 sm:p-6">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="sq-eyebrow">Importar notificación</p>
          <h2 class="sq-section-title text-xl font-semibold">Subir PDF</h2>
        </div>
        <span :if={@upload_history != []} class="sq-pill text-sm font-semibold">
          {length(@upload_history)} procesados
        </span>
      </div>

      <form id="upload-form" phx-submit="save" phx-change="validate" class="mt-4">
        <label
          class={[
            "sq-dropzone flex cursor-pointer flex-col items-center justify-center gap-2 px-6 py-8 text-center",
            @processing && "pointer-events-none opacity-50"
          ]}
          phx-drop-target={@uploads.pdf.ref}
        >
          <.icon name="hero-arrow-up-tray" class="size-7 text-[color:var(--sq-primary)]" />
          <span class="sq-section-title font-semibold">
            Arrastra aquí los PDFs de las notificaciones
          </span>
          <span class="text-sm text-[color:var(--sq-muted)]">
            o haz clic para seleccionarlos · hasta 20 archivos · máx. 25 MB c/u
          </span>
          <.live_file_input upload={@uploads.pdf} class="sr-only" />
        </label>

        <div
          :for={entry <- @uploads.pdf.entries}
          class="mt-4 flex items-center gap-3"
          id={"entry-#{entry.ref}"}
        >
          <.icon name="hero-document-text" class="size-5 text-[color:var(--sq-secondary)]" />
          <span class="flex-1 truncate text-sm font-medium">{entry.client_name}</span>
          <div class="h-2 w-32 overflow-hidden rounded-full bg-[color:var(--sq-secondary-soft)]">
            <div
              class="h-full rounded-full bg-[color:var(--sq-primary)]"
              style={"width: #{entry.progress}%"}
            />
          </div>
          <button
            type="button"
            phx-click="cancel-upload"
            phx-value-ref={entry.ref}
            class="text-[color:var(--sq-muted)] hover:text-[color:var(--sq-primary)]"
            aria-label="Cancelar"
          >
            <.icon name="hero-x-mark" class="size-4" />
          </button>
        </div>

        <p :for={err <- upload_errors(@uploads.pdf)} class="mt-2 text-sm text-[color:#a32b1d]">
          {upload_error_to_string(err)}
        </p>

        <div :if={@uploads.pdf.entries != [] && !@processing} class="mt-4">
          <button type="submit" class="sq-button-primary rounded-full px-5 py-2 text-sm font-semibold">
            Procesar PDF
          </button>
        </div>

        <div
          :if={@processing}
          class="mt-4 flex items-center gap-3 rounded-xl bg-[color:var(--sq-secondary-soft)] p-4"
        >
          <div class="sq-spinner" />
          <div>
            <p class="font-semibold">
              Procesando con IA… {@batch_total - @pending_count}/{@batch_total}
            </p>
            <p class="text-sm text-[color:var(--sq-muted)]">
              Extrayendo tipo, organismo, fechas y expediente de cada PDF.
            </p>
          </div>
        </div>
      </form>

      <div
        :if={@extraction_result}
        id="extraction-result"
        class="mt-5 rounded-2xl border border-[color:var(--sq-border)] p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="sq-eyebrow">Resultado de extracción</p>
            <h3 class="sq-section-title text-lg font-semibold">{@extraction_result.tipo_label}</h3>
          </div>
          <div class="flex items-center gap-2">
            <span
              :if={@extraction_result.requiere_revision}
              class="sq-estado sq-estado-warn"
              id="revision-badge"
            >
              <.icon name="hero-exclamation-triangle" class="size-3" /> Requiere revisión
            </span>
            <span
              :if={!@extraction_result.requiere_revision}
              class="sq-estado sq-estado-done"
              id="confidence-badge"
            >
              <.icon name="hero-check-circle" class="size-3" /> Alta confianza
            </span>
            <button
              type="button"
              phx-click="dismiss-extraction"
              class="text-[color:var(--sq-muted)] hover:text-[color:var(--sq-primary)]"
              aria-label="Cerrar"
            >
              <.icon name="hero-x-mark" class="size-4" />
            </button>
          </div>
        </div>

        <dl class="mt-4 grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl bg-[color:var(--sq-secondary-soft)] p-3">
            <dt class="text-xs text-[color:var(--sq-muted)]">Organismo</dt>
            <dd class="mt-1 font-semibold">{@extraction_result.organismo}</dd>
          </div>
          <div class="rounded-xl bg-[color:var(--sq-secondary-soft)] p-3">
            <dt class="text-xs text-[color:var(--sq-muted)]">Expediente</dt>
            <dd class="mt-1 font-semibold">{@extraction_result.expediente_id}</dd>
          </div>
          <div class="rounded-xl bg-[color:var(--sq-secondary-soft)] p-3">
            <dt class="text-xs text-[color:var(--sq-muted)]">Fecha notificación</dt>
            <dd class="mt-1 font-semibold">{fmt_date(@extraction_result.fecha_notificacion)}</dd>
          </div>
          <div class="rounded-xl bg-[color:var(--sq-secondary-soft)] p-3">
            <dt class="text-xs text-[color:var(--sq-muted)]">Inicio tramitación</dt>
            <dd class="mt-1 font-semibold">
              {fmt_date(@extraction_result.fecha_inicio_tramitacion)}
            </dd>
          </div>
        </dl>

        <div class="mt-4 flex items-center gap-2 text-sm">
          <span class="text-[color:var(--sq-muted)]">Confianza IA:</span>
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--sq-border)]">
            <div
              class={[
                "h-full rounded-full",
                @extraction_result.confianza >= 0.8 && "bg-[#1f7a4d]",
                @extraction_result.confianza >= 0.6 && @extraction_result.confianza < 0.8 &&
                  "bg-[#9a6a12]",
                @extraction_result.confianza < 0.6 && "bg-[#a32b1d]"
              ]}
              style={"width: #{round(@extraction_result.confianza * 100)}%"}
            />
          </div>
          <span class="font-semibold">{round(@extraction_result.confianza * 100)}%</span>
        </div>
      </div>

      <div :if={@upload_history != []} class="mt-5 border-t border-[color:var(--sq-border)] pt-5">
        <p class="sq-eyebrow">Historial de sesión</p>
        <ul class="mt-2 space-y-2">
          <li
            :for={entry <- Enum.take(@upload_history, 5)}
            id={"history-#{entry.id}"}
            class="flex items-center gap-3 rounded-xl p-2 text-sm transition hover:bg-[color:var(--sq-secondary-soft)]"
          >
            <.icon name="hero-document-check" class="size-4 text-[color:var(--sq-secondary)]" />
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium">{entry.filename}</p>
              <p class="text-xs text-[color:var(--sq-muted)]">
                {entry.result.tipo_label} · {entry.result.organismo}
              </p>
            </div>
            <span
              :if={entry.result.requiere_revision}
              class="sq-badge sq-badge-ambar text-xs"
            >
              Revisar
            </span>
            <span
              :if={!entry.result.requiere_revision}
              class="sq-badge sq-badge-verde text-xs"
            >
              OK
            </span>
          </li>
        </ul>
      </div>
    </section>
    """
  end

  defp upload_error_to_string(:too_large), do: "El archivo supera el tamaño máximo (25 MB)."
  defp upload_error_to_string(:too_many_files), do: "Solo se pueden subir hasta 20 PDFs a la vez."
  defp upload_error_to_string(:not_accepted), do: "Solo se aceptan archivos PDF."
  defp upload_error_to_string(_), do: "No se pudo subir el archivo."
end
