defmodule SQLeteWeb.RedistribucionEctoLiveTest do
  use SQLeteWeb.ConnCase

  import Phoenix.LiveViewTest

  alias SQLete.Documents.DocumentFile
  alias SQLete.Inbox.EctoSource
  alias SQLete.Repo

  setup do
    previous_source = Application.get_env(:sqlete, :inbox_source)
    Application.put_env(:sqlete, :inbox_source, EctoSource)

    on_exit(fn ->
      Application.put_env(:sqlete, :inbox_source, previous_source)
    end)
  end

  test "renders synthetic redistribution parents without a broken detail link", %{conn: conn} do
    insert_document!(expediente_id: "MATRIZ-UI-A", expediente_padre: "MATRIZ-UI")
    insert_document!(expediente_id: "MATRIZ-UI-B", expediente_padre: "MATRIZ-UI")
    insert_document!(expediente_id: "MATRIZ-UI-C", expediente_padre: "MATRIZ-UI")

    {:ok, view, html} = live(conn, ~p"/redistribucion")

    assert html =~ "MATRIZ-UI"
    assert html =~ "Matriz no importada"
    refute has_element?(view, "#redistribution-parent-matriz-ui")
  end

  defp insert_document!(attrs) do
    attrs =
      attrs
      |> Enum.into(%{})
      |> Map.put_new(:filename, "#{System.unique_integer([:positive])}.pdf")
      |> Map.put_new(:content_type, "application/pdf")
      |> Map.put_new(:byte_size, 1)
      |> Map.put_new(:checksum, "checksum-#{System.unique_integer([:positive])}")
      |> Map.put_new(:storage_key, "storage/#{System.unique_integer([:positive])}.pdf")
      |> Map.put_new(:status, :completed)
      |> Map.put_new(:ambito, "AGE")
      |> Map.put_new(:organismo, "Ministerio de Pruebas")
      |> Map.put_new(:asunto, "Solicitud de prueba")
      |> Map.put_new(:fecha, ~D[2026-01-01])
      |> Map.put_new(:inicio_tramitacion, ~D[2026-01-02])

    %DocumentFile{}
    |> DocumentFile.changeset(attrs)
    |> Repo.insert!()
  end
end
