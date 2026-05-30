defmodule SQLete.Inbox.Digest do
  @moduledoc """
  Pure presentation logic for the daily digest: groups solicitudes by the action
  their deadline requires and renders a plain-text version (Civio's email style).

  Operates only on `SQLete.Inbox.Solicitud` view-structs, so it is source-agnostic
  and reusable from the dashboard LiveView today and an Oban cron digest later
  (see PROYECTO-OPP2-DEFINICION §9). It never computes legal deadlines — it only
  reads the fields already calculated server-side.
  """

  alias SQLete.Inbox.Solicitud

  @categories [
    %{
      key: :a_reclamar,
      emoji: "🔴",
      title: "A reclamar",
      subtitle: "Plazo vencido o por vencer — reclamar ante el CTBG",
      estados: ["a_reclamar_silencio", "a_reclamar_incompleta"]
    },
    %{
      key: :reclamadas,
      emoji: "🟠",
      title: "Reclamadas ante el CTBG",
      subtitle: "En proceso de reclamación — seguir el procedimiento",
      estados: ["reclamada"]
    },
    %{
      key: :contencioso,
      emoji: "🔵",
      title: "Contencioso-administrativo",
      subtitle: "En procedimiento judicial",
      estados: ["contencioso"]
    }
  ]

  @type category :: :a_reclamar | :reclamadas | :contencioso

  @type group :: %{
          key: category(),
          emoji: String.t(),
          title: String.t(),
          subtitle: String.t(),
          count: non_neg_integer(),
          items: [Solicitud.t()]
        }

  @doc """
  Buckets solicitudes into the fixed digest categories (🔴 / 🟠 / 🔵), in order.

  Items in `:a_reclamar` are sorted by `dias_para_reclamar` ascending (most urgent
  first); the rest by `external_id`.
  """
  @spec grouped([Solicitud.t()]) :: [group()]
  def grouped(solicitudes) do
    Enum.map(@categories, fn cat ->
      items =
        solicitudes
        |> Enum.filter(&(to_string(&1.estado) in cat.estados))
        |> sort_items(cat.key)

      %{
        key: cat.key,
        emoji: cat.emoji,
        title: cat.title,
        subtitle: cat.subtitle,
        count: length(items),
        items: items
      }
    end)
  end

  @doc """
  Renders the digest as plain text for the clipboard / daily email.

  Pass `today:` for deterministic output (defaults to `Date.utc_today/0`); it is
  only used for the header date — the per-item countdowns come from the
  server-computed `dias_para_reclamar`.
  """
  @spec to_text([Solicitud.t()], keyword()) :: String.t()
  def to_text(solicitudes, opts \\ []) do
    today = Keyword.get(opts, :today, Date.utc_today())

    header = [
      "DIGEST DIARIO — #{fmt_date(today)}",
      String.duplicate("=", 50),
      ""
    ]

    sections =
      solicitudes
      |> grouped()
      |> Enum.with_index(1)
      |> Enum.map(fn {group, idx} -> section_text(group, idx) end)

    (header ++ sections)
    |> List.flatten()
    |> Enum.join("\n")
  end

  # ---------------------------------------------------------------------------
  # Internals
  # ---------------------------------------------------------------------------

  defp sort_items(items, :a_reclamar),
    do: Enum.sort_by(items, &(&1.dias_para_reclamar || 9999))

  defp sort_items(items, _key), do: Enum.sort_by(items, &to_string(&1.external_id))

  defp section_text(group, idx) do
    title_line = "#{idx}. #{String.upcase(group.title)} (#{group.count})"
    separator = String.duplicate("-", 40)

    body =
      if group.items == [] do
        ["   Sin expedientes en esta categoría."]
      else
        Enum.flat_map(group.items, &item_lines(&1, group.key))
      end

    [title_line, separator] ++ body ++ [""]
  end

  defp item_lines(sol, key) do
    [
      "   • [#{sol.external_id}] #{sol.asunto || "—"} (#{sol.autor || "—"})",
      "     #{item_meta(sol, key)}"
    ]
  end

  defp item_meta(%{dias_para_reclamar: dias} = sol, :a_reclamar) when is_integer(dias) do
    "Límite CTBG: #{fmt_date(sol.fecha_limite_reclamacion_ctbg)} · #{dias_text(dias)} para reclamar"
  end

  defp item_meta(sol, :a_reclamar) do
    "Límite CTBG: #{fmt_date(sol.fecha_limite_reclamacion_ctbg)}"
  end

  defp item_meta(sol, _key), do: "Reclamación: #{sol.reclamacion_ref || "sin nº"}"

  # --- minimal pure formatting (kept local to preserve module purity) ---

  defp dias_text(d) when d < 0, do: "vencido hace #{abs(d)} d"
  defp dias_text(0), do: "hoy"
  defp dias_text(1), do: "1 día"
  defp dias_text(d), do: "#{d} días"

  defp fmt_date(nil), do: "—"
  defp fmt_date(%Date{} = d), do: "#{pad(d.day)}/#{pad(d.month)}/#{d.year}"

  defp pad(n) when n < 10, do: "0#{n}"
  defp pad(n), do: "#{n}"
end
