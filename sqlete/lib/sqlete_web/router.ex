defmodule SQLeteWeb.Router do
  use SQLeteWeb, :router

  import Oban.Web.Router
  import ArcanaWeb.Router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {SQLeteWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", SQLeteWeb do
    pipe_through :browser

    live "/", DashboardLive, :index
    live "/inbox/:id", SolicitudLive, :show
    live "/alertas", AlertsLive, :index
    live "/redistribucion", RedistribucionLive, :index
    live "/entities", EntityListLive, :index
    live "/entities/:entity_id", EntityGraphLive, :show

    get "/documents/:id/pdf", DocumentController, :pdf
  end

  # Other scopes may use custom stacks.
  # scope "/api", SQLeteWeb do
  #   pipe_through :api
  # end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  # If you want to use the LiveDashboard in production, you should put
  # it behind authentication and allow only admins to access it.
  # If your application does not have an admins-only section yet,
  # you can use Plug.BasicAuth to set up some basic authentication
  # as long as you are also using SSL (which you should anyway).
  import Phoenix.LiveDashboard.Router

  scope "/dev" do
    pipe_through :browser

    live_dashboard "/dashboard", metrics: SQLeteWeb.Telemetry
    forward "/mailbox", Plug.Swoosh.MailboxPreview
  end

  scope "/" do
    pipe_through :browser

    oban_dashboard("/oban")
    arcana_dashboard("/arcana")
  end
end
