defmodule SQLete.Inbox.DigestTest do
  use ExUnit.Case, async: true

  alias SQLete.Inbox.Digest
  alias SQLete.Inbox.Solicitud

  defp sol(attrs), do: struct(Solicitud, attrs)

  describe "grouped/1" do
    test "buckets solicitudes into the three fixed categories in order" do
      sols = [
        sol(id: "1", external_id: "A", estado: :a_reclamar_silencio, dias_para_reclamar: 5),
        sol(id: "2", external_id: "B", estado: :a_reclamar_incompleta, dias_para_reclamar: 2),
        sol(id: "3", external_id: "C", estado: :reclamada, reclamacion_ref: "R-1"),
        sol(id: "4", external_id: "D", estado: :contencioso, reclamacion_ref: "R-2"),
        sol(id: "5", external_id: "E", estado: :en_plazo),
        sol(id: "6", external_id: "F", estado: :resuelta)
      ]

      assert [a_reclamar, reclamadas, contencioso] = Digest.grouped(sols)

      assert a_reclamar.key == :a_reclamar
      assert reclamadas.key == :reclamadas
      assert contencioso.key == :contencioso

      assert a_reclamar.count == 2
      assert reclamadas.count == 1
      assert contencioso.count == 1

      # en_plazo / resuelta belong to no digest category
      ids =
        Enum.flat_map([a_reclamar, reclamadas, contencioso], fn g ->
          Enum.map(g.items, & &1.id)
        end)

      refute "5" in ids
      refute "6" in ids
    end

    test "sorts a_reclamar items by dias_para_reclamar ascending (most urgent first)" do
      sols = [
        sol(id: "late", external_id: "L", estado: :a_reclamar_silencio, dias_para_reclamar: 20),
        sol(id: "soon", external_id: "S", estado: :a_reclamar_silencio, dias_para_reclamar: 1)
      ]

      assert [a_reclamar, _, _] = Digest.grouped(sols)
      assert Enum.map(a_reclamar.items, & &1.id) == ["soon", "late"]
    end

    test "returns the three categories with count 0 when nothing matches" do
      assert [a_reclamar, reclamadas, contencioso] = Digest.grouped([])
      assert a_reclamar.count == 0
      assert reclamadas.items == []
      assert contencioso.items == []
    end
  end

  describe "to_text/1" do
    test "renders a plain-text digest with header and category sections" do
      sols = [
        sol(
          id: "1",
          external_id: "EXP-1",
          asunto: "Asunto urgente",
          autor: "Ter",
          estado: :a_reclamar_silencio,
          dias_para_reclamar: 5,
          fecha_limite_reclamacion_ctbg: ~D[2026-06-10]
        ),
        sol(
          id: "2",
          external_id: "EXP-2",
          asunto: "Algo reclamado",
          autor: "Eva",
          estado: :reclamada,
          reclamacion_ref: "R CTBG 2024-0980"
        )
      ]

      text = Digest.to_text(sols, today: ~D[2026-05-30])

      assert text =~ "DIGEST DIARIO — 30/05/2026"
      assert text =~ "A RECLAMAR (1)"
      assert text =~ "RECLAMADAS ANTE EL CTBG (1)"
      assert text =~ "CONTENCIOSO-ADMINISTRATIVO (0)"
      assert text =~ "[EXP-1] Asunto urgente (Ter)"
      assert text =~ "Límite CTBG: 10/06/2026 · 5 días para reclamar"
      assert text =~ "Reclamación: R CTBG 2024-0980"
    end

    test "shows the empty placeholder for categories with no items" do
      text = Digest.to_text([], today: ~D[2026-05-30])
      assert text =~ "Sin expedientes en esta categoría"
    end
  end
end
