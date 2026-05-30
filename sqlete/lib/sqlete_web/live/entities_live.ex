defmodule SQLeteWeb.EntitiesLive do
  use SQLeteWeb, :live_view

  alias Arcana.Graph.GraphStore
  alias SQLete.Repo

  @impl true
  def mount(_params, _session, socket) do
    entities = list_entities()

    socket =
      socket
      |> assign(:page_title, "Entities")
      |> assign(:search, "")
      |> assign(:count, length(entities))
      |> stream(:entities, entities)

    {:ok, socket}
  end

  @impl true
  def handle_event("search", %{"search" => search}, socket) do
    entities = list_entities(search)

    socket =
      socket
      |> assign(:search, search)
      |> assign(:count, length(entities))
      |> stream(:entities, entities, reset: true)

    {:noreply, socket}
  end

  defp list_entities(search \\ "") do
    opts =
      if search != "" do
        [repo: Repo, search: search, limit: 100]
      else
        [repo: Repo, limit: 100]
      end

    GraphStore.list_entities(opts)
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={%{}} active={:entities}>
      <div class="flex-1 bg-base-100">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 class="text-2xl sm:text-3xl font-bold text-base-content mb-1">
                Entities
              </h1>
              <p class="text-base-content/60 text-sm">
                {@count} entities in the knowledge graph
              </p>
            </div>
            <form phx-change="search" class="w-full sm:w-72">
              <.input
                type="text"
                name="search"
                value={@search}
                placeholder="Search entities..."
                autocomplete="off"
                class="w-full px-4 py-2.5 rounded-xl border border-base-300 bg-base-100 text-base-content placeholder:text-base-content/40 focus:border-[#0050AA] focus:ring-2 focus:ring-[#0050AA]/20 transition-all outline-none text-sm"
              />
            </form>
          </div>

          <div class="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-base-200 bg-base-200/50">
                    <th class="text-left px-6 py-3.5 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                      Name
                    </th>
                    <th class="text-left px-6 py-3.5 text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody id="entities" phx-update="stream">
                  <tr
                    :for={{id, entity} <- @streams.entities}
                    id={id}
                    class="border-b border-base-100 hover:bg-base-200/50 transition-colors cursor-pointer group"
                    phx-click={JS.navigate(~p"/entities/#{entity.id}")}
                  >
                    <td class="px-6 py-3.5">
                      <div class="flex items-center gap-3">
                        <span class="font-medium text-base-content group-hover:text-[#0050AA] transition-colors">
                          {entity.name}
                        </span>
                      </div>
                    </td>
                    <td class="px-6 py-3.5">
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#0050AA]/10 text-[#0050AA]">
                        {normalize_type(entity.type)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div :if={@count == 0} class="py-16 text-center">
              <p class="text-base-content/50 text-sm">
                No entities found
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layouts.app>
    """
  end

  defp normalize_type(nil), do: "other"
  defp normalize_type(type) when is_atom(type), do: Atom.to_string(type)
  defp normalize_type(type) when is_binary(type), do: String.downcase(type)
end
