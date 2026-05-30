defmodule SQLete.Inbox.EctoSourceTest do
  use SQLete.DataCase, async: true

  alias SQLete.Documents.DocumentFile
  alias SQLete.Inbox.EctoSource

  describe "list_solicitudes/1" do
    test "annotates parent solicitudes with their redistributed children count" do
      parent = insert_document!(expediente_id: "MATRIZ-001", asunto: "Solicitud matriz")
      insert_document!(expediente_id: "MATRIZ-001-A", expediente_padre: "MATRIZ-001")
      insert_document!(expediente_id: "MATRIZ-001-B", expediente_padre: "MATRIZ-001")
      insert_document!(expediente_id: "MATRIZ-001-C", expediente_padre: "MATRIZ-001")

      solicitudes = EctoSource.list_solicitudes()

      assert %{children_count: 3} = Enum.find(solicitudes, &(&1.id == parent.id))
    end
  end

  describe "get_solicitud!/1" do
    test "loads parent and children for a real redistributed matrix" do
      parent = insert_document!(expediente_id: "MATRIZ-002", asunto: "Contratos marco")
      child = insert_document!(expediente_id: "MATRIZ-002-A", expediente_padre: "MATRIZ-002")
      insert_document!(expediente_id: "MATRIZ-002-B", expediente_padre: "MATRIZ-002")
      insert_document!(expediente_id: "MATRIZ-002-C", expediente_padre: "MATRIZ-002")

      parent_sol = EctoSource.get_solicitud!(parent.id)
      child_sol = EctoSource.get_solicitud!(child.id)

      assert parent_sol.children_count == 3

      assert Enum.map(parent_sol.children, & &1.external_id) == [
               "MATRIZ-002-A",
               "MATRIZ-002-B",
               "MATRIZ-002-C"
             ]

      assert child_sol.parent.id == parent.id
      assert child_sol.parent.external_id == "MATRIZ-002"
    end
  end

  describe "list_redistribution_groups/0" do
    test "uses a non-navigable synthetic parent when the matrix document is missing" do
      insert_document!(expediente_id: "MATRIZ-003-A", expediente_padre: "MATRIZ-003")
      insert_document!(expediente_id: "MATRIZ-003-B", expediente_padre: "MATRIZ-003")
      insert_document!(expediente_id: "MATRIZ-003-C", expediente_padre: "MATRIZ-003")

      assert [%{parent: parent, children: children}] = EctoSource.list_redistribution_groups()
      assert parent.id == nil
      assert parent.external_id == "MATRIZ-003"
      assert parent.children_count == 3
      assert length(children) == 3
    end

    test "does not return redistribution groups below the threshold" do
      insert_document!(expediente_id: "MATRIZ-004-A", expediente_padre: "MATRIZ-004")
      insert_document!(expediente_id: "MATRIZ-004-B", expediente_padre: "MATRIZ-004")

      assert EctoSource.list_redistribution_groups() == []
    end
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
