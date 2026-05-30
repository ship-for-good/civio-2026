defmodule SQLeteWeb.InboxComponents do
  @moduledoc """
  Shared function components and formatting helpers for the inbox UI.
  """
  use SQLeteWeb, :html

  @estado_labels %{
    en_plazo: "En plazo",
    reclamada: "Reclamada ante CTBG",
    contencioso: "Contencioso-administrativo",
    resuelta: "Resuelta",
    ganado_sin_info: "Ganado sin info recibida",
    a_reclamar_silencio: "Silencio negativo · Reclamar",
    a_reclamar_incompleta: "Respuesta incompleta · Reclamar"
  }

  @doc "Deadline traffic-light badge. Pass `label` to override the default text."
  attr :level, :atom, required: true, doc: ":verde | :ambar | :rojo"
  attr :dias, :integer, default: nil
  attr :label, :string, default: nil
  attr :class, :string, default: nil

  def semaforo(assigns) do
    ~H"""
    <span class={["sq-badge", "sq-badge-#{@level}", @class]}>
      <span class="sq-badge-dot" />
      {@label || semaforo_label(@level, @dias)}
    </span>
    """
  end

  @doc "Estado pill, colored by category."
  attr :estado, :any, required: true

  def estado_badge(assigns) do
    assigns = assign(assigns, :variant, estado_variant(assigns.estado))

    ~H"""
    <span class={["sq-estado", "sq-estado-#{@variant}"]}>{estado_label(@estado)}</span>
    """
  end

  @doc "Dashboard stat card."
  attr :label, :string, required: true
  attr :value, :any, required: true
  attr :accent, :string, default: "var(--sq-secondary)"

  def stat_card(assigns) do
    ~H"""
    <div class="sq-stat-card rounded-2xl p-5">
      <p class="sq-card-label">{@label}</p>
      <p class="sq-display mt-1 text-3xl font-bold" style={"color: #{@accent}"}>{@value}</p>
    </div>
    """
  end

  # --- formatting helpers ---

  @doc "Human label for an estado atom/string."
  def estado_label(estado) when is_atom(estado),
    do: Map.get(@estado_labels, estado, humanize(estado))

  def estado_label(estado) when is_binary(estado) do
    case Enum.find(@estado_labels, fn {k, _} -> to_string(k) == estado end) do
      {_k, label} -> label
      nil -> humanize(estado)
    end
  end

  @doc "Color category for an estado: :info | :danger | :warn | :done."
  def estado_variant(estado) do
    case to_string(estado) do
      "a_reclamar_silencio" -> "danger"
      "a_reclamar_incompleta" -> "danger"
      "reclamada" -> "warn"
      "contencioso" -> "warn"
      "resuelta" -> "done"
      "ganado_sin_info" -> "done"
      _ -> "info"
    end
  end

  @doc """
  Action-oriented deadline label for a solicitud.

  Surfaces the claim window already computed server-side: "¡Reclamar! 5 d" /
  "Reclamar: 12 d" for the a-reclamar estados (urgent prefix at ≤7 days), or
  "Vence: 12 d" counting down to the effective deadline for everything else.
  """
  def accion_plazo_label(sol) do
    cond do
      to_string(sol.estado) in ["a_reclamar_silencio", "a_reclamar_incompleta"] ->
        reclamar_label(sol.dias_para_reclamar)

      to_string(sol.estado) == "en_plazo" and is_integer(sol.dias_para_vencer) ->
        vencer_label(sol.dias_para_vencer)

      true ->
        semaforo_label(sol.semaforo, sol.dias_para_reclamar)
    end
  end

  @doc "Text for the 'Días' table column: days to CTBG limit, else to vencimiento."
  def dias_column_label(sol), do: fmt_dias(dias_for_column(sol))

  @doc "Color (CSS value) for the 'Días' column, matching the semáforo thresholds."
  def dias_column_color(sol), do: dias_color(dias_for_column(sol))

  defp dias_for_column(sol) do
    cond do
      is_integer(sol.dias_para_reclamar) -> sol.dias_para_reclamar
      is_integer(sol.dias_para_vencer) -> sol.dias_para_vencer
      true -> nil
    end
  end

  defp reclamar_label(d) when is_integer(d) and d < 0, do: "¡Reclamar! vencido hace #{abs(d)} d"
  defp reclamar_label(d) when is_integer(d) and d <= 7, do: "¡Reclamar! #{d} d"
  defp reclamar_label(d) when is_integer(d), do: "Reclamar: #{d} d"
  defp reclamar_label(_), do: "Reclamar"

  defp vencer_label(d) when d < 0, do: "Vencido hace #{abs(d)} d"
  defp vencer_label(0), do: "Vence hoy"
  defp vencer_label(d), do: "Vence: #{d} d"

  defp dias_color(nil), do: "var(--sq-muted)"
  defp dias_color(d) when d <= 3, do: "#a32b1d"
  defp dias_color(d) when d <= 10, do: "#9a6a12"
  defp dias_color(_), do: "#1f7a4d"

  @doc "Format a Date as dd/mm/yyyy, or em dash when nil."
  def fmt_date(nil), do: "—"

  def fmt_date(%Date{} = date) do
    "#{pad(date.day)}/#{pad(date.month)}/#{date.year}"
  end

  @doc "Human countdown text for days remaining."
  def fmt_dias(nil), do: "—"
  def fmt_dias(d) when d < 0, do: "Vencido hace #{abs(d)} d"
  def fmt_dias(0), do: "Vence hoy"
  def fmt_dias(1), do: "1 día"
  def fmt_dias(d), do: "#{d} días"

  defp semaforo_label(_level, dias) when is_integer(dias), do: fmt_dias(dias)
  defp semaforo_label(:verde, _), do: "En plazo"
  defp semaforo_label(:ambar, _), do: "Atención"
  defp semaforo_label(:rojo, _), do: "Urgente"

  defp humanize(value) do
    value
    |> to_string()
    |> String.replace("_", " ")
    |> String.capitalize()
  end

  defp pad(n) when n < 10, do: "0#{n}"
  defp pad(n), do: "#{n}"
end
