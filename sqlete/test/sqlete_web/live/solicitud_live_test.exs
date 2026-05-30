defmodule SQLeteWeb.SolicitudLiveTest do
  use SQLeteWeb.ConnCase

  import Phoenix.LiveViewTest

  test "renders the detail view with timeline and semáforo", %{conn: conn} do
    {:ok, _view, html} = live(conn, ~p"/inbox/exp-0003")

    assert html =~ "Cronología de notificaciones"
    assert html =~ "Plazo de reclamación"
    assert html =~ "00045-00091200"
  end

  test "shows a recommended action for claimable silent requests", %{conn: conn} do
    {:ok, _view, html} = live(conn, ~p"/inbox/exp-0003")

    assert html =~ "Acción recomendada"
    assert html =~ "Reclamar al CTBG por silencio administrativo"
  end

  test "shows a calendar export for expedientes with a relevant deadline", %{conn: conn} do
    {:ok, view, html} = live(conn, ~p"/inbox/exp-0003")

    assert html =~ "Exportar a Calendar"
    assert has_element?(view, "#calendar-export[download='sqlete-00045-00091200.ics']")

    assert has_element?(
             view,
             "#calendar-export[href^='data:text/calendar;charset=utf-8;base64,']"
           )
  end

  test "shows redistributed child expedientes on the parent detail", %{conn: conn} do
    {:ok, _view, html} = live(conn, ~p"/inbox/exp-0100")

    assert html =~ "Subexpedientes redistribuidos"
    assert html =~ "Ministerio del Interior"
    assert html =~ "00050-00092002"
  end

  test "links child expedientes back to their parent", %{conn: conn} do
    {:ok, _view, html} = live(conn, ~p"/inbox/exp-0102")

    assert html =~ "Expediente padre"
    assert html =~ "00050-00092000"
  end

  test "navigating from the dashboard opens the detail", %{conn: conn} do
    {:ok, view, _html} = live(conn, ~p"/")

    {:ok, _detail, html} =
      view
      |> element("#solicitudes-exp-0001")
      |> render_click()
      |> follow_redirect(conn)

    assert html =~ "00001-00087725"
  end
end
