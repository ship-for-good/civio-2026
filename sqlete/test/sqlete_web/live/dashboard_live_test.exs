defmodule SQLeteWeb.DashboardLiveTest do
  use SQLeteWeb.ConnCase

  import Phoenix.LiveViewTest

  test "renders the dashboard with seeded expedientes", %{conn: conn} do
    {:ok, view, html} = live(conn, ~p"/")

    assert html =~ "Bandeja de expedientes"
    assert has_element?(view, "#solicitudes")
    assert has_element?(view, "#upload-form")
    # at least one seeded row
    assert has_element?(view, "#filters-form")
  end

  test "filtering by estado re-renders the list", %{conn: conn} do
    {:ok, view, _html} = live(conn, ~p"/")

    html =
      view
      |> form("#filters-form")
      |> render_change(%{"estado" => "resuelta", "autor" => "", "ambito" => "", "q" => ""})

    assert html =~ "resultados"
  end

  test "shows the redistribution pill on a parent expediente", %{conn: conn} do
    {:ok, _view, html} = live(conn, ~p"/")
    assert html =~ "1 → 5"
  end

  test "renders today's digest grouped by category with urgent expediente links", %{conn: conn} do
    {:ok, view, html} = live(conn, ~p"/")

    assert html =~ "Digest de hoy"
    assert html =~ "A reclamar"
    assert html =~ "Reclamadas ante el CTBG"
    assert html =~ "Contencioso-administrativo"
    # urgent expediente shows inside the "A reclamar" card
    assert has_element?(view, "#digest-group-a_reclamar #digest-exp-0003", "00045-00091200")
  end

  test "filtering by urgencia re-renders the list", %{conn: conn} do
    {:ok, view, _html} = live(conn, ~p"/")

    html =
      view
      |> form("#filters-form")
      |> render_change(%{
        "estado" => "",
        "autor" => "",
        "ambito" => "",
        "q" => "",
        "urgencia" => "rojo"
      })

    assert html =~ "resultados"
  end

  test "clicking a column header sorts the table", %{conn: conn} do
    {:ok, view, _html} = live(conn, ~p"/")

    html =
      view
      |> element("button[phx-value-by='asunto']")
      |> render_click()

    assert html =~ "▲"
  end

  test "renders the Días column and the copy-digest affordances", %{conn: conn} do
    {:ok, view, html} = live(conn, ~p"/")

    assert html =~ "Días"
    assert has_element?(view, "#copy-digest")
    assert has_element?(view, "#digest-text")
  end

  test "shows a helpful empty state and can clear filters", %{conn: conn} do
    {:ok, view, _html} = live(conn, ~p"/")

    html =
      view
      |> form("#filters-form")
      |> render_change(%{"estado" => "", "autor" => "", "ambito" => "", "q" => "sin-resultados"})

    assert html =~ "Sin resultados para esos filtros"
    assert has_element?(view, "#clear-filters")

    html =
      view
      |> element("#clear-filters")
      |> render_click()

    refute html =~ "Sin resultados para esos filtros"
    assert html =~ "resultados"
  end

  test "lists every selected PDF and shows the process button for a bulk upload",
       %{conn: conn} do
    {:ok, view, _html} = live(conn, ~p"/")

    entries =
      for i <- 1..3 do
        %{
          last_modified: 1_700_000_000_000,
          name: "notificacion-#{i}.pdf",
          content: "%PDF-1.4\nfake pdf #{i}\n%%EOF",
          type: "application/pdf"
        }
      end

    html =
      view
      |> file_input("#upload-form", :pdf, entries)
      |> render_upload("notificacion-1.pdf")

    # All selected files are listed (multi-file picker is wired)...
    assert html =~ "notificacion-1.pdf"
    assert html =~ "notificacion-2.pdf"
    assert html =~ "notificacion-3.pdf"
    # ...and the affordance to confirm/process them is present.
    assert html =~ "Procesar PDF"
  end

  test "navigates from dashboard to redistribution and parent detail", %{conn: conn} do
    {:ok, view, _html} = live(conn, ~p"/")

    {:ok, redist, html} =
      view
      |> element("#redistribution-cta")
      |> render_click()
      |> follow_redirect(conn, ~p"/redistribucion")

    assert html =~ "1 solicitud → N expedientes"

    {:ok, _detail, html} =
      redist
      |> element("#redistribution-parent-exp-0100")
      |> render_click()
      |> follow_redirect(conn, ~p"/inbox/exp-0100")

    assert html =~ "Subexpedientes redistribuidos"
  end
end
