defmodule SQLete.Inbox.CalendarExportTest do
  use ExUnit.Case, async: true

  alias SQLete.Inbox.CalendarExport
  alias SQLete.Inbox.Solicitud

  test "builds an all-day CTBG claim event when the claim deadline exists" do
    sol = %Solicitud{
      id: "exp-0003",
      external_id: "00045-00091200",
      estado: :a_reclamar_silencio,
      asunto: "Ejecución presupuestaria de fondos Next Generation",
      organismo: "Ministerio de Hacienda",
      fecha_limite_reclamacion_ctbg: ~D[2026-06-19],
      vencimiento_efectivo: ~D[2026-05-19]
    }

    event = CalendarExport.event_for(sol)
    ics = CalendarExport.ics(event)

    assert event.filename == "sqlete-00045-00091200.ics"
    assert ics =~ "BEGIN:VCALENDAR"
    assert ics =~ "SUMMARY:Reclamar CTBG · 00045-00091200"
    assert ics =~ "DTSTART;VALUE=DATE:20260619"
    assert ics =~ "DTEND;VALUE=DATE:20260620"
    assert ics =~ "DESCRIPTION:Organismo: Ministerio de Hacienda"
    assert ics =~ "Estado: a reclamar silencio"
  end

  test "falls back to the effective due date when no CTBG claim deadline exists" do
    sol = %Solicitud{
      id: "exp-0002",
      external_id: "2024/2503283",
      estado: :en_plazo,
      asunto: "Listas de espera",
      organismo: "Departament de Salut",
      vencimiento_efectivo: ~D[2026-06-01]
    }

    event = CalendarExport.event_for(sol)
    ics = CalendarExport.ics(event)

    assert event.filename == "sqlete-2024-2503283.ics"
    assert ics =~ "SUMMARY:Vence solicitud · 2024/2503283"
    assert ics =~ "DTSTART;VALUE=DATE:20260601"
  end

  test "does not build an event without a deadline date" do
    assert CalendarExport.event_for(%Solicitud{id: "exp", external_id: "no-date"}) == nil
  end

  test "encodes the event as a text calendar data uri" do
    sol = %Solicitud{
      id: "exp-0003",
      external_id: "00045-00091200",
      fecha_limite_reclamacion_ctbg: ~D[2026-06-19]
    }

    assert "data:text/calendar;charset=utf-8;base64," <> encoded =
             sol
             |> CalendarExport.event_for()
             |> CalendarExport.data_uri()

    decoded = encoded |> Base.decode64!()
    assert decoded =~ "BEGIN:VCALENDAR"
    assert decoded =~ "END:VCALENDAR"
  end
end
