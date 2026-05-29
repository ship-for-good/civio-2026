defmodule SQLeteWeb.PageController do
  use SQLeteWeb, :controller

  def home(conn, _params) do
    render(conn, :home)
  end
end
