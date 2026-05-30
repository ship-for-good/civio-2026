defmodule SQLeteWeb.RedistribucionLiveTest do
  use SQLeteWeb.ConnCase

  import Phoenix.LiveViewTest

  test "renders redistribution groups", %{conn: conn} do
    {:ok, _view, html} = live(conn, ~p"/redistribucion")

    assert html =~ "1 solicitud → N expedientes"
    assert html =~ "1 → 5 expedientes"
  end
end
