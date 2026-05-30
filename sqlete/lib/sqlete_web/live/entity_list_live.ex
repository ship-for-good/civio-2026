defmodule SQLeteWeb.EntityListLive do
  @moduledoc """
  Lists all Arcana graph entities with search and type filtering.
  Displays entity name and type in a searchable table.
  """
  use SQLeteWeb, :live_view

  alias Arcana.Graph.GraphStore
  alias SQLete.Repo

  @page_size 50

  @impl true
  def mount(_params, _session, socket) do
    entities = list_entities(search: "", type: "", limit: @page_size, offset: 0)
    types = available_types()

    socket =
      socket
      |> assign(:page_title, "Entities")
      |> assign(:search, "")
      |> assign(:selected_type, "")
      |> assign(:types, types)
      |> assign(:count, length(entities))
      |> assign(:has_more, length(entities) == @page_size)
      |> assign(:offset, 0)
      |> stream(:entities, entities)

    {:ok, socket}
  end

  @impl true
  def handle_event("search", %{"q" => q, "type" => type}, socket) do
    entities = list_entities(search: q, type: type, limit: @page_size, offset: 0)

    {:noreply,
     socket
     |> assign(:search, q)
     |> assign(:selected_type, type)
     |> assign(:count, length(entities))
     |> assign(:has_more, length(entities) == @page_size)
     |> assign(:offset, 0)
     |> stream(:entities, entities, reset: true)}
  end

  def handle_event("load-more", _params, socket) do
    new_offset = socket.assigns.offset + @page_size

    entities =
      list_entities(
        search: socket.assigns.search,
        type: socket.assigns.selected_type,
        limit: @page_size,
        offset: new_offset
      )

    {:noreply,
     socket
     |> assign(:offset, new_offset)
     |> assign(:count, socket.assigns.count + length(entities))
     |> assign(:has_more, length(entities) == @page_size)
     |> stream(:entities, entities)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} active={:entities} breadcrumbs={[%{label: "Entities"}]}>
      <section class="sq-hero rounded-3xl p-6 sm:p-8">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="sq-eyebrow">Arcana Knowledge Graph</p>
            <h1 class="sq-display mt-2 text-3xl font-bold sm:text-4xl">Entities</h1>
            <p class="mt-2 max-w-2xl text-[color:var(--sq-muted)]">
              Browse and search all entities in the knowledge graph. Click on any entity to view its relationship graph.
            </p>
          </div>
          <span class="sq-pill text-sm font-semibold">{@count} entities</span>
        </div>
      </section>

      <section class="sq-panel rounded-3xl p-5 sm:p-6">
        <form phx-change="search" id="entity-search-form" class="flex flex-wrap items-center gap-3">
          <div class="relative flex-1 min-w-[200px]">
            <.icon
              name="hero-magnifying-glass"
              class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--sq-muted)]"
            />
            <input
              type="search"
              name="q"
              value={@search}
              placeholder="Search entities..."
              class="w-full rounded-full border border-[color:var(--sq-border)] bg-transparent py-2 pl-10 pr-4 text-sm"
            />
          </div>
          <select
            name="type"
            class="rounded-full border border-[color:var(--sq-border)] bg-transparent px-4 py-2 text-sm"
          >
            <option value="">All types</option>
            <option
              :for={type <- @types}
              value={type}
              selected={type == @selected_type}
            >
              {type}
            </option>
          </select>
        </form>

        <div class="mt-6 overflow-x-auto">
          <table class="sq-table w-full">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Mentions</th>
                <th>Relationships</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="entities" phx-update="stream">
              <tr
                :for={{dom_id, entity} <- @streams.entities}
                id={dom_id}
                phx-click={JS.navigate(~p"/entities/#{entity.id}")}
                class="cursor-pointer transition-colors hover:bg-[color:var(--sq-primary-soft)]"
              >
                <td class="font-semibold">{entity.name}</td>
                <td>
                  <span class={[
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    type_badge_class(entity.type)
                  ]}>
                    {entity.type}
                  </span>
                </td>
                <td class="text-[color:var(--sq-muted)]">{Map.get(entity, :mention_count, 0)}</td>
                <td class="text-[color:var(--sq-muted)]">
                  {Map.get(entity, :relationship_count, 0)}
                </td>
                <td>
                  <.link
                    navigate={~p"/entities/#{entity.id}"}
                    class="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--sq-primary)] hover:underline"
                  >
                    <.icon name="hero-arrow-top-right-on-square" class="size-4" /> View Graph
                  </.link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div :if={@has_more} class="mt-6 flex justify-center">
          <button
            id="load-more-btn"
            type="button"
            phx-click="load-more"
            class="sq-button-secondary inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold"
          >
            <.icon name="hero-chevron-down" class="size-4" /> Load more
          </button>
        </div>

        <div
          :if={@count == 0}
          class="mt-6 rounded-2xl border border-dashed border-[color:var(--sq-border)] p-8 text-center"
        >
          <.icon name="hero-magnifying-glass" class="mx-auto size-8 text-[color:var(--sq-muted)]" />
          <p class="mt-3 sq-section-title font-semibold">No entities found</p>
          <p class="mt-1 text-sm text-[color:var(--sq-muted)]">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      </section>
    </Layouts.app>
    """
  end

  defp list_entities(opts) do
    search = Keyword.get(opts, :search, "")
    type = Keyword.get(opts, :type, "")
    limit = Keyword.get(opts, :limit, @page_size)
    offset = Keyword.get(opts, :offset, 0)

    query_opts =
      [repo: Repo, limit: limit, offset: offset]
      |> maybe_add(:search, search)
      |> maybe_add(:type, type)

    GraphStore.list_entities(query_opts)
  end

  defp maybe_add(opts, _key, value) when value in [nil, ""], do: opts
  defp maybe_add(opts, key, value), do: Keyword.put(opts, key, value)

  defp available_types do
    GraphStore.list_entities(repo: Repo, limit: 10_000)
    |> Enum.map(& &1.type)
    |> Enum.uniq()
    |> Enum.sort()
  end

  defp type_badge_class(type) do
    case String.downcase(type || "") do
      "person" -> "bg-blue-100 text-blue-800"
      "organization" -> "bg-purple-100 text-purple-800"
      "location" -> "bg-green-100 text-green-800"
      "event" -> "bg-yellow-100 text-yellow-800"
      "concept" -> "bg-pink-100 text-pink-800"
      _ -> "bg-gray-100 text-gray-800"
    end
  end
end
