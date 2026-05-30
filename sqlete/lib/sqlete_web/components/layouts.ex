defmodule SQLeteWeb.Layouts do
  @moduledoc """
  This module holds layouts and related functionality
  used by your application.
  """
  use SQLeteWeb, :html

  # Embed all files in layouts/* within this module.
  # The default root.html.heex file contains the HTML
  # skeleton of your application, namely HTML headers
  # and other static content.
  embed_templates "layouts/*"

  @doc """
  Renders your app layout.

  This function is typically invoked from every template,
  and it often contains your application menu, sidebar,
  or similar.

  ## Examples

      <Layouts.app flash={@flash}>
        <h1>Content</h1>
      </Layouts.app>

  """
  attr :flash, :map, required: true, doc: "the map of flash messages"

  attr :current_scope, :map,
    default: nil,
    doc: "the current [scope](https://hexdocs.pm/phoenix/scopes.html)"

  attr :active, :atom,
    default: nil,
    doc: "the active nav section (:inbox | :alertas | :redistribucion | :entities)"

  attr :breadcrumbs, :list,
    default: [],
    doc:
      "breadcrumb trail as a list of %{label: string, path: string | nil}; last item is the current page"

  slot :inner_block, required: true

  def app(assigns) do
    ~H"""
    <div class="sq-page min-h-screen">
      <div class="sq-shell mx-auto w-full max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8">
        <header class="sq-nav flex items-center justify-between gap-4 rounded-2xl px-5 py-3">
          <.link navigate={~p"/"} class="flex items-center gap-3">
            <img src={~p"/images/mascota-icon.png"} alt="SQLete" class="h-14 w-14 object-contain" />
            <span class="sq-brand text-xl font-bold tracking-tight">SQLete</span>
            <span class="sq-pill hidden text-xs sm:inline-block">Civio Inbox</span>
          </.link>

          <nav class="flex items-center gap-1 sm:gap-2">
            <.link
              navigate={~p"/"}
              class={[
                "sq-nav-link text-sm font-semibold",
                @active == :inbox && "text-[color:var(--sq-primary)]"
              ]}
            >
              Inbox
            </.link>
            <.link
              navigate={~p"/alertas"}
              class={[
                "sq-nav-link text-sm font-semibold",
                @active == :alertas && "text-[color:var(--sq-primary)]"
              ]}
            >
              Alertas
            </.link>
            <.link
              navigate={~p"/redistribucion"}
              class={[
                "sq-nav-link text-sm font-semibold",
                @active == :redistribucion && "text-[color:var(--sq-primary)]"
              ]}
            >
              Redistribución
            </.link>
            <.link
              navigate={~p"/entities"}
              class={[
                "sq-nav-link text-sm font-semibold",
                @active == :entities && "text-[color:var(--sq-primary)]"
              ]}
            >
              Entities
            </.link>
            <.theme_toggle />
          </nav>
        </header>

        <.breadcrumbs :if={@breadcrumbs != []} items={@breadcrumbs} />

        <main class="mt-6 space-y-6">
          {render_slot(@inner_block)}
        </main>
      </div>
    </div>

    <.flash_group flash={@flash} />
    """
  end

  @doc """
  Renders a breadcrumb trail. Each item is `%{label: string, path: string | nil}`;
  items with a `path` are links, the last item (current page) is plain text.
  """
  attr :items, :list, required: true

  def breadcrumbs(assigns) do
    ~H"""
    <nav aria-label="breadcrumb" class="mt-4">
      <ol class="flex flex-wrap items-center gap-1 text-sm text-[color:var(--sq-muted)]">
        <li :for={{item, idx} <- Enum.with_index(@items)} class="flex items-center gap-1">
          <.icon
            :if={idx > 0}
            name="hero-chevron-right-micro"
            class="size-3 text-[color:var(--sq-muted)]"
          />
          <.link
            :if={item[:path]}
            navigate={item.path}
            class="sq-nav-link font-medium hover:text-[color:var(--sq-primary)]"
          >
            {item.label}
          </.link>
          <span
            :if={!item[:path]}
            class="font-semibold text-[color:var(--sq-ink)]"
            aria-current="page"
          >
            {item.label}
          </span>
        </li>
      </ol>
    </nav>
    """
  end

  @doc """
  Shows the flash group with standard titles and content.

  ## Examples

      <.flash_group flash={@flash} />
  """
  attr :flash, :map, required: true, doc: "the map of flash messages"
  attr :id, :string, default: "flash-group", doc: "the optional id of flash container"

  def flash_group(assigns) do
    ~H"""
    <div id={@id} aria-live="polite">
      <.flash kind={:info} flash={@flash} />
      <.flash kind={:error} flash={@flash} />

      <.flash
        id="client-error"
        kind={:error}
        title={gettext("We can't find the internet")}
        phx-disconnected={show(".phx-client-error #client-error") |> JS.remove_attribute("hidden")}
        phx-connected={hide("#client-error") |> JS.set_attribute({"hidden", ""})}
        hidden
      >
        {gettext("Attempting to reconnect")}
        <.icon name="hero-arrow-path" class="ml-1 size-3 motion-safe:animate-spin" />
      </.flash>

      <.flash
        id="server-error"
        kind={:error}
        title={gettext("Something went wrong!")}
        phx-disconnected={show(".phx-server-error #server-error") |> JS.remove_attribute("hidden")}
        phx-connected={hide("#server-error") |> JS.set_attribute({"hidden", ""})}
        hidden
      >
        {gettext("Attempting to reconnect")}
        <.icon name="hero-arrow-path" class="ml-1 size-3 motion-safe:animate-spin" />
      </.flash>
    </div>
    """
  end

  @doc """
  Provides dark vs light theme toggle based on themes defined in app.css.

  See <head> in root.html.heex which applies the theme before page load.
  """
  def theme_toggle(assigns) do
    ~H"""
    <button
      type="button"
      aria-label="Cambiar tema"
      class="card relative flex flex-row items-center border-2 border-base-300 bg-base-300 rounded-full cursor-pointer"
      phx-click={JS.dispatch("phx:toggle-theme")}
    >
      <div class="absolute w-1/2 h-full rounded-full border-1 border-base-200 bg-base-100 brightness-200 left-0 [[data-theme=dark]_&]:left-1/2 transition-[left] pointer-events-none" />

      <span class="flex p-2 w-1/2 pointer-events-none">
        <.icon name="hero-sun-micro" class="size-4 opacity-75" />
      </span>

      <span class="flex p-2 w-1/2 pointer-events-none">
        <.icon name="hero-moon-micro" class="size-4 opacity-75" />
      </span>
    </button>
    """
  end
end
