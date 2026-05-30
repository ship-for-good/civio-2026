defmodule SQLete.Inbox.CalendarExport do
  @moduledoc """
  Builds iCalendar exports for the actionable deadline of a solicitud.
  """

  alias SQLete.Inbox.Solicitud

  @type event :: %{
          id: String.t(),
          date: Date.t(),
          summary: String.t(),
          description: String.t(),
          filename: String.t()
        }

  @spec event_for(Solicitud.t()) :: event() | nil
  def event_for(%Solicitud{fecha_limite_reclamacion_ctbg: %Date{} = date} = sol) do
    build_event(sol, date, "Reclamar CTBG · #{sol.external_id}")
  end

  def event_for(%Solicitud{vencimiento_efectivo: %Date{} = date} = sol) do
    build_event(sol, date, "Vence solicitud · #{sol.external_id}")
  end

  def event_for(%Solicitud{}), do: nil

  @spec ics(event()) :: String.t()
  def ics(%{date: date} = event) do
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SQLete//Calendar Export//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:#{escape_text(event.id)}@sqlete.local",
      "DTSTAMP:#{dtstamp()}",
      "DTSTART;VALUE=DATE:#{format_date(date)}",
      "DTEND;VALUE=DATE:#{format_date(Date.add(date, 1))}",
      "SUMMARY:#{escape_text(event.summary)}",
      "DESCRIPTION:#{escape_text(event.description)}",
      "END:VEVENT",
      "END:VCALENDAR"
    ]
    |> Enum.join("\r\n")
  end

  @spec data_uri(event()) :: String.t()
  def data_uri(event) do
    "data:text/calendar;charset=utf-8;base64,#{Base.encode64(ics(event))}"
  end

  defp build_event(sol, date, summary) do
    %{
      id: "#{sol.id}-#{format_date(date)}",
      date: date,
      summary: summary,
      description: description(sol),
      filename: "sqlete-#{safe_filename(sol.external_id)}.ics"
    }
  end

  defp description(sol) do
    [
      {"Organismo", sol.organismo},
      {"Asunto", sol.asunto},
      {"Estado", estado_label(sol.estado)}
    ]
    |> Enum.reject(fn {_label, value} -> is_nil(value) or value == "" end)
    |> Enum.map_join("\n", fn {label, value} -> "#{label}: #{value}" end)
  end

  defp estado_label(nil), do: nil

  defp estado_label(estado) do
    estado
    |> to_string()
    |> String.replace("_", " ")
  end

  defp safe_filename(nil), do: "expediente"

  defp safe_filename(value) do
    value
    |> to_string()
    |> String.replace(~r/[^A-Za-z0-9_-]+/, "-")
    |> String.trim("-")
    |> case do
      "" -> "expediente"
      filename -> filename
    end
  end

  defp escape_text(value) do
    value
    |> to_string()
    |> String.replace("\\", "\\\\")
    |> String.replace("\n", "\\n")
    |> String.replace(",", "\\,")
    |> String.replace(";", "\\;")
  end

  defp format_date(%Date{} = date) do
    "#{date.year}#{pad(date.month)}#{pad(date.day)}"
  end

  defp dtstamp do
    Date.utc_today()
    |> format_date()
    |> Kernel.<>("T000000Z")
  end

  defp pad(value) when value < 10, do: "0#{value}"
  defp pad(value), do: to_string(value)
end
