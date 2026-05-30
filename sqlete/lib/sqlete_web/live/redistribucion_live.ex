defmodule SQLeteWeb.RedistribucionLive do
  @moduledoc """
  Redistribution view: groups where one solicitud was split into N expedientes
  (e.g. one request fanned out across ministerios). Shows each child's deadline.
  """
  use SQLeteWeb, :live_view

  import SQLeteWeb.InboxComponents

  alias SQLete.Inbox

  @impl true
  def mount(_params, _session, socket) do
    if connected?(socket), do: Inbox.subscribe()

    {:ok,
     socket
     |> assign(:page_title, "Redistribución")
     |> assign(:groups, Inbox.list_redistribution_groups())}
  end

  @impl true
  def handle_info(msg, socket) when elem(msg, 0) in [:document_updated, :inbox_changed] do
    {:noreply, assign(socket, :groups, Inbox.list_redistribution_groups())}
  end

  def handle_info(_msg, socket), do: {:noreply, socket}

  @impl true
  def render(assigns) do
    assigns = assign(assigns, :groups_with_urgent, mark_urgent_children(assigns.groups))

    ~H"""
    <Layouts.app
      flash={@flash}
      active={:redistribucion}
      breadcrumbs={[%{label: "Inbox", path: ~p"/"}, %{label: "Redistribución"}]}
    >
      <section class="sq-hero rounded-3xl p-6 sm:p-8">
        <p class="sq-eyebrow">Detección de redistribución</p>
        <h1 class="sq-display mt-2 text-3xl font-bold">1 solicitud → N expedientes</h1>
        <p class="mt-2 max-w-2xl text-[color:var(--sq-muted)]">
          Cuando una misma solicitud se reparte entre varios organismos, SQLete agrupa los
          subexpedientes y destaca el que tiene el plazo más urgente.
        </p>
      </section>

      <div
        :if={@groups_with_urgent == []}
        class="sq-panel rounded-3xl p-10 text-center"
      >
        <.icon name="hero-rectangle-stack" class="mx-auto size-10 text-[color:var(--sq-muted)]" />
        <p class="mt-3 font-semibold">No se han detectado redistribuciones todavía</p>
        <p class="mt-1 text-sm text-[color:var(--sq-muted)]">
          Cuando una solicitud se divida en varios expedientes, aparecerá agrupada aquí.
        </p>
      </div>

      <section :for={group <- @groups_with_urgent} class="sq-panel rounded-3xl p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="sq-eyebrow">{group.parent.ambito}</p>
            <h2 class="sq-section-title text-xl font-semibold">{group.parent.asunto}</h2>
            <.link
              :if={group.parent.id}
              id={"redistribution-parent-#{group.parent.id}"}
              navigate={~p"/inbox/#{group.parent.id}"}
              class="text-sm font-medium text-[color:var(--sq-secondary)]"
            >
              {group.parent.external_id}
            </.link>
            <div :if={!group.parent.id} class="mt-1 flex flex-wrap items-center gap-2">
              <span class="text-sm font-medium text-[color:var(--sq-secondary)]">
                {group.parent.external_id}
              </span>
              <span class="sq-pill text-xs font-semibold">Matriz no importada</span>
            </div>
          </div>
          <span class="sq-pill text-sm font-semibold">
            1 → {length(group.children)} expedientes
          </span>
        </div>

        <ul class="mt-4 divide-y divide-[color:var(--sq-border)]">
          <li
            :for={{child, idx} <- Enum.with_index(group.children)}
            class={[
              "flex flex-wrap items-center justify-between gap-3 py-3",
              idx == group.urgent_idx && "sq-urgent-child rounded-xl px-3 -mx-3"
            ]}
          >
            <div class="min-w-0">
              <.link
                navigate={~p"/inbox/#{child.id}"}
                class="font-semibold hover:text-[color:var(--sq-primary)]"
              >
                {child.organismo}
              </.link>
              <p class="text-xs text-[color:var(--sq-muted)]">{child.external_id}</p>
              <span
                :if={idx == group.urgent_idx}
                class="sq-estado sq-estado-danger mt-1 inline-flex text-xs"
              >
                <.icon name="hero-fire" class="size-3" /> Plazo más urgente
              </span>
            </div>
            <div class="flex items-center gap-2">
              <.estado_badge estado={child.estado} />
              <.semaforo level={child.semaforo} dias={child.dias_para_reclamar} />
            </div>
          </li>
        </ul>
      </section>
    </Layouts.app>
    """
  end

  defp mark_urgent_children(groups) do
    Enum.map(groups, fn group ->
      children = group.children

      urgent_idx =
        case children do
          [] ->
            nil

          _ ->
            children
            |> Enum.with_index()
            |> Enum.min_by(fn {child, _idx} -> urgency_score(child) end)
            |> then(fn {_child, idx} -> idx end)
        end

      Map.put(group, :urgent_idx, urgent_idx)
    end)
  end

  defp urgency_score(child) do
    semaforo_rank = %{rojo: 0, ambar: 1, verde: 2}
    rank = Map.get(semaforo_rank, child.semaforo, 3)

    dias =
      cond do
        is_integer(child.dias_para_reclamar) -> child.dias_para_reclamar
        is_integer(child.dias_para_vencer) -> child.dias_para_vencer
        true -> 999
      end

    {rank, dias}
  end
end
