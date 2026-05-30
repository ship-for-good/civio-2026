defmodule SQLeteWeb.EntityGraphLive do
  use SQLeteWeb, :live_view

  alias Arcana.Graph.GraphStore
  alias SQLete.Graph
  alias SQLete.Repo

  @impl true
  def mount(%{"entity_id" => entity_id}, _session, socket) do
    {:ok,
     socket
     |> assign(:page_title, "Entity Graph")
     |> assign(:entity, nil)
     |> assign(:graph_data, nil)
     |> assign(:loading, true)
     |> assign(:error, nil)
     |> assign(:depth, 1)
     |> assign(:selected_node, nil)
     |> assign(:selected_node_relationships, [])
     |> assign(:source_documents, [])
     |> assign(:entity_source_documents, [])
     |> load_entity_and_graph(entity_id)}
  end

  defp load_entity_and_graph(socket, entity_id) do
    depth = socket.assigns.depth

    case GraphStore.get_entity(entity_id, repo: Repo) do
      {:ok, entity} ->
        graph_data = build_graph_data(entity, depth)
        entity_source_documents = Graph.list_solicitudes_for_entity(entity.id)

        socket
        |> assign(:entity, entity)
        |> assign(:graph_data, graph_data)
        |> assign(:entity_source_documents, entity_source_documents)
        |> assign(:loading, false)

      {:error, _reason} ->
        socket
        |> assign(:loading, false)
        |> assign(:error, "Entity not found with ID: #{entity_id}")
    end
  end

  defp build_graph_data(root_entity, depth) do
    {all_entities, all_relationships} = traverse_graph(root_entity, depth, MapSet.new(), [])

    node_ids = MapSet.new(all_entities, & &1.id)

    nodes =
      all_entities
      |> Enum.map(fn entity ->
        %{
          id: entity.id,
          name: entity.name,
          type: normalize_type(entity.type),
          description: entity.description
        }
      end)

    links =
      all_relationships
      |> Enum.uniq_by(& &1.id)
      |> Enum.filter(fn rel ->
        MapSet.member?(node_ids, rel.source_id) && MapSet.member?(node_ids, rel.target_id)
      end)
      |> Enum.map(fn rel ->
        %{
          source: rel.source_id,
          target: rel.target_id,
          type: rel.type,
          strength: rel.strength || 5,
          metadata: Map.get(rel, :metadata, %{})
        }
      end)

    %{nodes: nodes, links: links, root_id: root_entity.id}
  end

  defp traverse_graph(nil, _depth, _visited, relationships) do
    {[], relationships}
  end

  defp traverse_graph(_entity, 0, _visited, relationships) do
    {[], relationships}
  end

  defp traverse_graph(entity, depth, visited, relationships) do
    entity_id = entity.id

    if MapSet.member?(visited, entity_id) do
      {[entity], relationships}
    else
      visited = MapSet.put(visited, entity_id)

      entity_relationships = GraphStore.get_relationships(entity_id, repo: Repo)
      all_relationships = relationships ++ entity_relationships

      connected_ids =
        entity_relationships
        |> Enum.flat_map(fn rel -> [rel.source_id, rel.target_id] end)
        |> Enum.uniq()
        |> Enum.reject(&(&1 == entity_id))

      connected_entities =
        connected_ids
        |> Enum.map(fn id ->
          case GraphStore.get_entity(id, repo: Repo) do
            {:ok, e} -> e
            _ -> nil
          end
        end)
        |> Enum.reject(&is_nil/1)

      {nested_entities, nested_relationships} =
        if depth > 1 do
          connected_entities
          |> Enum.reduce({[], all_relationships}, fn e, {entities_acc, rels_acc} ->
            {new_entities, new_rels} = traverse_graph(e, depth - 1, visited, rels_acc)
            {entities_acc ++ new_entities, new_rels}
          end)
        else
          {[], all_relationships}
        end

      all_entities =
        ([entity] ++ connected_entities ++ nested_entities)
        |> Enum.uniq_by(& &1.id)

      {all_entities, nested_relationships}
    end
  end

  @impl true
  def handle_event("node-clicked", %{"id" => id, "name" => name, "type" => type}, socket) do
    case GraphStore.get_entity(id, repo: Repo) do
      {:ok, _entity} ->
        current_node_ids = MapSet.new(socket.assigns.graph_data.nodes, & &1.id)

        relationships = GraphStore.get_relationships(id, repo: Repo)

        relationship_details =
          relationships
          |> Enum.filter(fn rel ->
            MapSet.member?(current_node_ids, rel.source_id) &&
              MapSet.member?(current_node_ids, rel.target_id)
          end)
          |> Enum.map(fn rel ->
            other_id = if rel.source_id == id, do: rel.target_id, else: rel.source_id

            other_entity =
              case GraphStore.get_entity(other_id, repo: Repo) do
                {:ok, e} -> e
                _ -> nil
              end

            if other_entity do
              %{
                type: rel.type,
                direction: if(rel.source_id == id, do: :outgoing, else: :incoming),
                metadata: Map.get(rel, :metadata, %{}),
                strength: rel.strength,
                entity: %{
                  id: other_entity.id,
                  name: other_entity.name,
                  type: normalize_type(other_entity.type)
                }
              }
            end
          end)
          |> Enum.reject(&is_nil/1)

        source_documents = Graph.list_solicitudes_for_entity(id)

        {:noreply,
         socket
         |> assign(:selected_node, %{id: id, name: name, type: type})
         |> assign(:selected_node_relationships, relationship_details)
         |> assign(:source_documents, source_documents)}

      {:error, _} ->
        {:noreply, socket}
    end
  end

  def handle_event("close-detail", _params, socket) do
    {:noreply,
     socket
     |> assign(:selected_node, nil)
     |> assign(:selected_node_relationships, [])
     |> assign(:source_documents, [])}
  end

  def handle_event("change-depth", %{"depth" => depth_str}, socket) do
    depth = String.to_integer(depth_str)
    entity_id = socket.assigns.entity.id

    socket =
      socket
      |> assign(:depth, depth)
      |> assign(:loading, true)
      |> load_entity_and_graph(entity_id)

    {:noreply, push_event(socket, "graph-data", socket.assigns.graph_data)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <Layouts.app flash={@flash} current_scope={%{}} active={:entities}>
      <div class="flex-1">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <.link
                navigate={~p"/entities"}
                class="inline-flex items-center gap-2 text-base-content/60 hover:text-base-content mb-3 transition-colors"
              >
                <.icon name="hero-arrow-left-mini" class="w-4 h-4" /> Back to entities
              </.link>
              <h1 class="text-2xl sm:text-3xl font-bold text-base-content mb-1">
                {@entity.name || "Entity"}
              </h1>
              <div class="flex items-center gap-3 flex-wrap">
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#0050AA]/10 text-[#0050AA]">
                  {normalize_type(@entity.type)}
                </span>
                <span :if={@entity.description} class="text-base-content/60 text-sm">
                  {@entity.description}
                </span>
              </div>
            </div>
          </div>

          <div :if={@loading} class="flex items-center justify-center py-16">
            <div class="text-center">
              <div class="w-8 h-8 border-2 border-[#0050AA] border-t-transparent rounded-full animate-spin mx-auto mb-4">
              </div>
              <span class="text-base-content/60">Loading entity...</span>
            </div>
          </div>

          <div :if={@error && !@loading} class="bg-error/10 border border-error/20 rounded-xl p-4">
            <p class="text-error">{@error}</p>
          </div>
        </div>

        <div :if={@entity && !@loading} class="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <div class="relative">
            <div
              :if={@selected_node}
              class="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-sm border border-base-200 rounded-2xl shadow-xl max-w-sm w-96 animate-fade-in overflow-hidden"
            >
              <div class="bg-gradient-to-r from-[#0050AA] to-[#0070DD] p-4">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white uppercase tracking-wider">
                        {@selected_node.type}
                      </span>
                    </div>
                    <h3 class="font-bold text-white text-lg leading-tight">
                      {@selected_node.name}
                    </h3>
                  </div>
                  <div class="flex items-center gap-1 ml-2">
                    <.link
                      navigate={~p"/entities/#{@selected_node.id}"}
                      class="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                      title="View entity"
                    >
                      <.icon name="hero-arrow-top-right-on-square" class="w-5 h-5 text-white" />
                    </.link>
                    <button
                      phx-click="close-detail"
                      class="p-2 hover:bg-white/20 rounded-xl transition-all duration-200"
                    >
                      <.icon name="hero-x-mark" class="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              <div class="p-4">
                <div :if={@selected_node_relationships != []} class="space-y-3">
                  <div class="flex items-center justify-between">
                    <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                      Connections
                    </p>
                    <span class="text-xs text-base-content/40">
                      {length(@selected_node_relationships)} relationships
                    </span>
                  </div>

                  <div class="space-y-2 max-h-72 overflow-y-auto pr-1">
                    <div
                      :for={rel <- @selected_node_relationships}
                      class="group relative bg-gradient-to-r from-base-100 to-base-50 border border-base-200 rounded-xl p-3 hover:border-[#0050AA]/30 hover:shadow-md transition-all duration-200"
                    >
                      <div class="flex items-center gap-2 mb-2">
                        <div class={[
                          "flex items-center justify-center w-6 h-6 rounded-lg",
                          if(rel.direction == :outgoing, do: "bg-emerald-100", else: "bg-blue-100")
                        ]}>
                          <.icon
                            name={
                              if rel.direction == :outgoing,
                                do: "hero-arrow-right-mini",
                                else: "hero-arrow-left-mini"
                            }
                            class={[
                              "w-4 h-4",
                              if(rel.direction == :outgoing,
                                do: "text-emerald-600",
                                else: "text-blue-600"
                              )
                            ]}
                          />
                        </div>
                        <span class="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
                          {rel.type |> String.replace("_", " ")}
                        </span>
                      </div>

                      <div class="flex items-center gap-3">
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-base-content truncate">
                            {rel.entity.name}
                          </p>
                          <p class="text-xs text-base-content/50">
                            {rel.entity.type}
                          </p>
                        </div>
                      </div>

                      <div
                        :if={is_map(rel.metadata) && map_size(rel.metadata) > 0}
                        class="mt-3 pt-3 border-t border-base-200"
                      >
                        <div class="grid grid-cols-2 gap-2">
                          <div
                            :for={{key, value} <- rel.metadata}
                            :if={value != nil && value != ""}
                            class="bg-white rounded-lg px-2.5 py-1.5 border border-base-100"
                          >
                            <p class="text-[10px] text-base-content/50 uppercase tracking-wider font-medium">
                              {format_metadata_key(key)}
                            </p>
                            <p class="text-sm font-semibold text-base-content">
                              {format_metadata_value(value)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div :if={@selected_node_relationships == []} class="text-center py-6">
                  <div class="w-12 h-12 mx-auto mb-3 bg-base-100 rounded-full flex items-center justify-center">
                    <.icon name="hero-link-slash" class="w-6 h-6 text-base-content/30" />
                  </div>
                  <p class="text-sm text-base-content/50">
                    No connections available
                  </p>
                </div>

                <div :if={@source_documents != []} class="mt-4 pt-4 border-t border-base-200">
                  <div class="flex items-center justify-between mb-3">
                    <p class="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                      Documentos fuente
                    </p>
                    <span class="text-xs text-base-content/40">
                      {length(@source_documents)} {if length(@source_documents) == 1,
                        do: "documento",
                        else: "documentos"}
                    </span>
                  </div>

                  <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                    <.link
                      :for={doc <- @source_documents}
                      navigate={~p"/inbox/#{doc.id}"}
                      class="block bg-gradient-to-r from-base-100 to-base-50 border border-base-200 rounded-xl p-3 hover:border-[#0050AA]/30 hover:shadow-md transition-all duration-200"
                    >
                      <div class="flex items-center gap-2 mb-1">
                        <.icon name="hero-document-text" class="w-4 h-4 text-[#0050AA]" />
                        <p class="font-semibold text-sm text-base-content truncate">
                          {doc.expediente_id || "Sin expediente"}
                        </p>
                      </div>
                      <p :if={doc.organismo} class="text-xs text-base-content/60 truncate">
                        {doc.organismo}
                      </p>
                      <p :if={doc.asunto} class="text-xs text-base-content/50 mt-1 line-clamp-2">
                        {doc.asunto}
                      </p>
                    </.link>
                  </div>
                </div>

                <div :if={@source_documents == []} class="mt-4 pt-4 border-t border-base-200">
                  <p class="text-xs text-base-content/40 text-center">
                    Sin documentos fuente vinculados
                  </p>
                </div>
              </div>
            </div>

            <div class="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
              <div class="p-4 border-b border-base-200">
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <h2 class="font-semibold text-base-content">Knowledge Graph</h2>
                    <p class="text-sm text-base-content/60">
                      Entity and relationship visualization
                    </p>
                  </div>
                  <div class="flex items-center gap-2 text-sm text-base-content/60">
                    <span>
                      {length(@graph_data.nodes)} nodes
                    </span>
                    <span>&bull;</span>
                    <span>
                      {length(@graph_data.links)} relationships
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <label class="text-sm font-medium text-base-content/70">
                    Graph depth:
                  </label>
                  <div class="flex items-center gap-2">
                    <button
                      :for={depth_option <- [1, 2, 3, 4]}
                      phx-click="change-depth"
                      phx-value-depth={depth_option}
                      class={[
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        if(@depth == depth_option,
                          do: "bg-[#0050AA] text-white",
                          else: "bg-base-200 text-base-content/70 hover:bg-base-300"
                        )
                      ]}
                    >
                      {depth_option}
                    </button>
                  </div>
                  <span class="text-xs text-base-content/50 ml-2">
                    (relationship levels)
                  </span>
                </div>
              </div>

              <div
                id="knowledge-graph"
                phx-hook="KnowledgeGraph"
                phx-update="ignore"
                data-graph-data={Jason.encode!(@graph_data)}
                class="w-full h-[600px]"
              >
              </div>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <.stat_card
              label="Total nodes"
              value={length(@graph_data.nodes)}
              icon="hero-circle-stack"
            />
            <.stat_card
              label="Relationships"
              value={length(@graph_data.links)}
              icon="hero-arrows-right-left"
            />
            <.stat_card
              label="Graph depth"
              value={@depth}
              icon="hero-arrows-up-down"
            />
            <.stat_card
              label="Unique types"
              value={count_unique_types(@graph_data.nodes)}
              icon="hero-tag"
            />
          </div>

          <div
            :if={@entity.description}
            class="mt-6 bg-base-100 border border-base-300 rounded-2xl p-6"
          >
            <h3 class="font-semibold text-base-content mb-4">Entity Details</h3>
            <div class="prose prose-sm max-w-none">
              <div class="text-base-content/80 whitespace-pre-wrap text-sm">
                {@entity.description}
              </div>
            </div>
          </div>

          <%!-- Source Documents Grid for Main Entity --%>
          <div
            :if={@entity_source_documents != []}
            class="mt-6 bg-base-100 border border-base-300 rounded-2xl p-6"
          >
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-semibold text-base-content">Documentos Fuente</h3>
              <span class="text-sm text-base-content/50">
                {length(@entity_source_documents)} {if length(@entity_source_documents) == 1,
                  do: "documento",
                  else: "documentos"}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <.link
                :for={doc <- @entity_source_documents}
                navigate={~p"/inbox/#{doc.id}"}
                class="block bg-gradient-to-br from-base-100 to-base-50 border border-base-200 rounded-xl p-4 hover:border-[#0050AA]/30 hover:shadow-lg transition-all duration-200"
              >
                <div class="flex items-center gap-2 mb-2">
                  <.icon name="hero-document-text" class="w-5 h-5 text-[#0050AA]" />
                  <p class="font-semibold text-sm text-base-content truncate">
                    {doc.expediente_id || "Sin expediente"}
                  </p>
                </div>
                <p :if={doc.organismo} class="text-xs text-base-content/60 truncate">
                  {doc.organismo}
                </p>
                <p :if={doc.asunto} class="text-xs text-base-content/50 mt-2 line-clamp-2">
                  {doc.asunto}
                </p>
              </.link>
            </div>
          </div>

          <div
            :if={@entity_source_documents == []}
            class="mt-6 bg-base-100 border border-base-300 rounded-2xl p-6"
          >
            <div class="text-center py-4">
              <.icon
                name="hero-document-magnifying-glass"
                class="w-8 h-8 text-base-content/30 mx-auto mb-2"
              />
              <p class="text-sm text-base-content/50">
                No hay documentos fuente vinculados a esta entidad
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

  def format_metadata_key(key) when is_binary(key) do
    key
    |> String.replace("_", " ")
    |> String.split(" ")
    |> Enum.map(&String.capitalize/1)
    |> Enum.join(" ")
  end

  def format_metadata_key(key), do: to_string(key)

  def format_metadata_value(value) when is_binary(value), do: value
  def format_metadata_value(value) when is_number(value), do: to_string(value)
  def format_metadata_value(value) when is_list(value), do: Enum.join(value, ", ")
  def format_metadata_value(value) when is_map(value), do: Jason.encode!(value)
  def format_metadata_value(nil), do: "-"
  def format_metadata_value(value), do: inspect(value)

  def count_unique_types(nodes) do
    nodes
    |> Enum.map(& &1.type)
    |> Enum.uniq()
    |> length()
  end

  def stat_card(assigns) do
    ~H"""
    <div class="bg-base-100 border border-base-300 rounded-xl p-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-base-200 rounded-lg flex items-center justify-center">
          <.icon name={@icon} class="w-5 h-5 text-base-content/60" />
        </div>
        <div>
          <div class="text-2xl font-bold text-base-content">{@value}</div>
          <div class="text-sm text-base-content/60">{@label}</div>
        </div>
      </div>
    </div>
    """
  end
end
