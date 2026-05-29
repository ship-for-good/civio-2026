defmodule SQLeteWeb.PageController do
  use SQLeteWeb, :controller

  def home(conn, _params) do
    render(conn, :home, page_title: "SQLete")
  end
end
