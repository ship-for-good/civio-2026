defmodule SQLete.Inbox.EctoSource do
  @moduledoc """
  Ecto-backed implementation of `SQLete.Inbox.Source`.

  Reads solicitudes straight from the `document_files` columns filled during
  ingestion by `SQLete.Documents.FieldExtractor` (structured extraction from the
  PDF text). The deadline fields (§7) are always computed here, server-side, so
  the frontend never computes legal plazos itself.

  This source is intentionally column-based (not graph-based): the GraphRAG graph
  is optional enrichment and never blocks the dashboard.
  """

  @behaviour SQLete.Inbox.Source

  import Ecto.Query

  alias SQLete.Documents.DocumentFile
  alias SQLete.Inbox.Solicitud
  alias SQLete.Repo

  @pubsub SQLete.PubSub
  @topic "inbox"

  # A parent with >= N children is a "1 → N" redistribution group (mirrors FakeSource).
  @redistribution_threshold 3

  @impl true
  def list_solicitudes(filters \\ %{}) do
    dfs = load_document_files()
    child_counts = child_counts_by_parent(dfs)

    dfs
    |> Enum.map(&to_solicitud(&1, child_counts: child_counts))
    |> apply_filters(filters)
    |> Enum.sort_by(&sort_key/1)
  end

  @impl true
  def get_solicitud!(id) do
    dfs = load_document_files()
    by_id = Map.new(dfs, fn df -> {df.id, df} end)
    by_expediente = Map.new(dfs, fn df -> {df.expediente_id, df} end)
    child_counts = child_counts_by_parent(dfs)
    df = Map.fetch!(by_id, id)

    sol = to_solicitud(df, child_counts: child_counts)

    children =
      dfs
      |> Enum.filter(&(&1.expediente_padre == df.expediente_id))
      |> Enum.map(&to_solicitud(&1, child_counts: child_counts))
      |> Enum.sort_by(&sort_key/1)

    parent =
      case Map.get(by_expediente, df.expediente_padre) do
        %DocumentFile{} = parent_df -> to_solicitud(parent_df, child_counts: child_counts)
        _ -> nil
      end

    %{sol | children: children, parent: parent}
  end

  @impl true
  def list_redistribution_groups do
    # Direct/column path (NO graph): a child carries its matriz in `expediente_padre`
    # (extracted by FieldExtractor). Group children by that, resolve the parent to the
    # matriz document when it was also ingested, and keep groups above the threshold.
    dfs = load_document_files()
    by_expediente = Map.new(dfs, fn df -> {df.expediente_id, df} end)
    child_counts = child_counts_by_parent(dfs)

    dfs
    |> Enum.filter(fn df -> present?(df.expediente_padre) end)
    |> Enum.group_by(& &1.expediente_padre)
    |> Enum.map(fn {parent_expediente, child_dfs} ->
      parent =
        case Map.get(by_expediente, parent_expediente) do
          %DocumentFile{} = parent_df -> to_solicitud(parent_df, child_counts: child_counts)
          _ -> synthetic_parent(parent_expediente, child_dfs)
        end

      children =
        child_dfs
        |> Enum.map(&to_solicitud(&1, child_counts: child_counts))
        |> Enum.sort_by(&sort_key/1)

      %{parent: %{parent | children_count: length(children)}, children: children}
    end)
    |> Enum.filter(fn group -> length(group.children) >= @redistribution_threshold end)
    |> Enum.sort_by(fn group -> -length(group.children) end)
  end

  defp present?(value), do: is_binary(value) and String.trim(value) != ""

  defp child_counts_by_parent(dfs) do
    dfs
    |> Enum.filter(fn df -> present?(df.expediente_padre) end)
    |> Enum.frequencies_by(& &1.expediente_padre)
  end

  # Parent solicitud when the matriz document itself was not ingested.
  defp synthetic_parent(parent_expediente, [first | _] = child_dfs) do
    %Solicitud{
      id: nil,
      external_id: parent_expediente,
      ambito: first.ambito,
      asunto: "Solicitud matriz redistribuida (#{parent_expediente})",
      organismo: nil,
      estado: :redistribuida,
      semaforo: :verde,
      children_count: length(child_dfs)
    }
  end

  @impl true
  def dashboard_stats do
    sols = list_solicitudes()
    by_estado = Enum.frequencies_by(sols, & &1.estado)

    %{
      total: length(sols),
      urgentes: Enum.count(sols, &(&1.semaforo == :rojo)),
      a_reclamar:
        Enum.count(sols, &(&1.estado in [:a_reclamar_silencio, :a_reclamar_incompleta])),
      en_plazo: Map.get(by_estado, :en_plazo, 0),
      resueltas: Map.get(by_estado, :resuelta, 0),
      by_estado: by_estado
    }
  end

  @doc "Subscribe the calling process to inbox change broadcasts."
  def subscribe, do: Phoenix.PubSub.subscribe(@pubsub, @topic)

  @doc "Broadcast an inbox change to all subscribers."
  def broadcast(message), do: Phoenix.PubSub.broadcast(@pubsub, @topic, message)

  @doc "Parse a date string in common formats (YYYY-MM-DD, DD/MM/YYYY, etc.)"
  def parse_date(nil), do: nil
  def parse_date(""), do: nil

  def parse_date(date_string) when is_binary(date_string) do
    date_string
    |> String.trim()
    |> try_parse_date_formats()
  end

  defp try_parse_date_formats(date_string) do
    # Try ISO format first (YYYY-MM-DD)
    case Date.from_iso8601(date_string) do
      {:ok, date} -> date
      _ -> try_european_format(date_string)
    end
  end

  defp try_european_format(date_string) do
    # Try DD/MM/YYYY format
    case Regex.run(~r/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, date_string) do
      [_, day, month, year] ->
        with {d, ""} <- Integer.parse(day),
             {m, ""} <- Integer.parse(month),
             {y, ""} <- Integer.parse(year),
             {:ok, date} <- Date.new(y, m, d) do
          date
        else
          _ -> nil
        end

      _ ->
        # Try DD-MM-YYYY format
        case Regex.run(~r/^(\d{1,2})-(\d{1,2})-(\d{4})$/, date_string) do
          [_, day, month, year] ->
            with {d, ""} <- Integer.parse(day),
                 {m, ""} <- Integer.parse(month),
                 {y, ""} <- Integer.parse(year),
                 {:ok, date} <- Date.new(y, m, d) do
              date
            else
              _ -> nil
            end

          _ ->
            nil
        end
    end
  end

  # ---------------------------------------------------------------------------
  # Loading
  # ---------------------------------------------------------------------------

  defp load_document_files do
    # Documents with extracted fields (processing or completed) are surfaced as
    # solicitudes; uploaded/queued (no fields yet) and failed ones are excluded
    # because they carry no actionable data.
    DocumentFile
    |> where([d], d.status in [:completed, :processing])
    |> order_by([d], desc: d.inserted_at)
    |> Repo.all()
  end

  # ---------------------------------------------------------------------------
  # document_files row -> Solicitud (with §7 deadline engine)
  # ---------------------------------------------------------------------------

  defp to_solicitud(%DocumentFile{} = df, opts) do
    today = Date.utc_today()
    child_counts = Keyword.get(opts, :child_counts, %{})

    dates = %{
      filing: df.fecha,
      inicio_tramitacion: df.inicio_tramitacion,
      prorroga: df.prorroga,
      resolucion: df.resolucion,
      notificacion: df.notificacion
    }

    estado0 = compute_estado(df)
    vencimiento = compute_vencimiento_efectivo(dates)
    estado = maybe_silencio(estado0, vencimiento, today)

    fecha_limite = compute_fecha_limite(estado, dates)
    dias = if fecha_limite, do: Date.diff(fecha_limite, today)
    dias_vencer = if vencimiento, do: Date.diff(vencimiento, today)

    dias_ref =
      if estado in [:a_reclamar_silencio, :a_reclamar_incompleta], do: dias, else: dias_vencer

    %Solicitud{
      id: df.id,
      external_id: external_id(df),
      ambito: df.ambito,
      fecha_solicitud: df.fecha,
      asunto: df.asunto,
      organismo: df.organismo,
      inicio_tramitacion: df.inicio_tramitacion,
      prorroga_20_1: df.prorroga,
      resolucion: df.resolucion,
      notificacion: df.notificacion,
      notas: df.notes,
      autor: df.autor,
      reclamacion_ref: df.reclamacion_ref,
      parent_id: df.expediente_padre,
      estado: estado,
      vencimiento_efectivo: vencimiento,
      fecha_limite_reclamacion_ctbg: fecha_limite,
      dias_para_reclamar: dias,
      dias_para_vencer: dias_vencer,
      semaforo: compute_semaforo(estado, dias_ref),
      children_count: Map.get(child_counts, df.expediente_id, 0),
      notificaciones: build_notificaciones(dates),
      children: [],
      parent: nil
    }
  end

  defp external_id(%DocumentFile{expediente_id: id}) when is_binary(id) and id != "", do: id
  defp external_id(%DocumentFile{filename: name}) when is_binary(name), do: Path.rootname(name)
  defp external_id(_), do: "—"

  # ---------------------------------------------------------------------------
  # §7 Estado + deadline engine (column-fed)
  # ---------------------------------------------------------------------------

  defp compute_estado(%DocumentFile{} = df) do
    sentido = df.resolucion_sentido

    cond do
      df.doc_type == "reclamacion_ctbg" and sentido != nil -> :resuelta
      df.doc_type == "reclamacion_ctbg" -> :reclamada
      df.reclamacion_ref != nil and sentido == nil -> :reclamada
      sentido in ["estimatoria", "parcial"] -> :resuelta
      sentido in ["desestimatoria", "inadmision"] -> :a_reclamar_incompleta
      df.doc_type == "resolucion_desestimatoria" -> :a_reclamar_incompleta
      df.doc_type in ["resolucion_estimatoria", "resolucion_parcial"] -> :resuelta
      not is_nil(df.resolucion) -> :resuelta
      true -> :en_plazo
    end
  end

  # Silence: an in-plazo request whose effective deadline passed becomes "a reclamar".
  defp maybe_silencio(:en_plazo, %Date{} = vencimiento, today) do
    if Date.compare(today, vencimiento) == :gt, do: :a_reclamar_silencio, else: :en_plazo
  end

  defp maybe_silencio(estado, _vencimiento, _today), do: estado

  defp compute_vencimiento_efectivo(dates) do
    cond do
      dates.prorroga != nil and dates.inicio_tramitacion != nil ->
        add_months(dates.inicio_tramitacion, 2)

      dates.inicio_tramitacion != nil ->
        add_months(dates.inicio_tramitacion, 1)

      dates.filing != nil ->
        # Fall back to the filing date when there is no acknowledgement date.
        add_months(dates.filing, 1)

      true ->
        nil
    end
  end

  # Claim window = 1 month from notification. When the notification date wasn't
  # extracted, fall back to the resolution date as a proxy (notification is the
  # firma date or a few days after) so the countdown still works.
  defp compute_fecha_limite(:a_reclamar_incompleta, %{notificacion: notif, resolucion: resol}) do
    case notif || resol do
      %Date{} = date -> add_months(date, 1)
      _ -> nil
    end
  end

  defp compute_fecha_limite(:a_reclamar_silencio, %{resolucion: nil} = dates) do
    case compute_vencimiento_efectivo(dates) do
      %Date{} = vencimiento -> add_months(vencimiento, 1)
      _ -> nil
    end
  end

  defp compute_fecha_limite(_estado, _dates), do: nil

  defp compute_semaforo(estado, _dias) when estado in [:resuelta, :ganado_sin_info], do: :verde

  defp compute_semaforo(estado, dias)
       when estado in [:a_reclamar_silencio, :a_reclamar_incompleta] do
    cond do
      is_integer(dias) and dias <= 3 -> :rojo
      is_integer(dias) and dias <= 10 -> :ambar
      true -> :rojo
    end
  end

  defp compute_semaforo(_estado, dias) do
    cond do
      is_integer(dias) and dias <= 3 -> :rojo
      is_integer(dias) and dias <= 10 -> :ambar
      true -> :verde
    end
  end

  defp add_months(%Date{} = date, n) do
    months = date.year * 12 + (date.month - 1) + n
    year = div(months, 12)
    month = rem(months, 12) + 1
    day = min(date.day, Date.days_in_month(%Date{year: year, month: month, day: 1}))
    Date.new!(year, month, day)
  end

  defp add_months(nil, _n), do: nil

  # ---------------------------------------------------------------------------
  # Notificaciones timeline (from the extracted dates)
  # ---------------------------------------------------------------------------

  defp build_notificaciones(dates) do
    [
      build_notice(:inicio_tramitacion, dates.inicio_tramitacion),
      build_notice(:prorroga, dates.prorroga),
      build_notice(:resolucion_completa, dates.resolucion)
    ]
    |> Enum.reject(&is_nil/1)
    |> Enum.sort_by(& &1.fecha_notificacion, Date)
  end

  defp build_notice(_tipo, nil), do: nil
  defp build_notice(tipo, %Date{} = date), do: %{tipo: tipo, fecha_notificacion: date}

  # ---------------------------------------------------------------------------
  # Filtering / sorting
  # ---------------------------------------------------------------------------

  defp apply_filters(sols, filters) do
    filters = normalize_filters(filters)

    Enum.filter(sols, fn s ->
      match_field?(filters[:estado], to_string(s.estado)) and
        match_field?(filters[:autor], s.autor) and
        match_field?(filters[:ambito], s.ambito) and
        match_query?(filters[:q], s)
    end)
  end

  defp normalize_filters(filters) do
    filters
    |> Enum.map(fn {k, v} -> {to_atom_key(k), blank_to_nil(v)} end)
    |> Enum.into(%{})
  end

  defp to_atom_key(k) when is_atom(k), do: k
  defp to_atom_key(k) when is_binary(k), do: String.to_existing_atom(k)

  defp blank_to_nil(v) when v in ["", nil], do: nil
  defp blank_to_nil(v), do: v

  defp match_field?(nil, _value), do: true
  defp match_field?(filter, value), do: to_string(filter) == to_string(value)

  defp match_query?(nil, _s), do: true

  defp match_query?(q, s) do
    haystack =
      [s.external_id, s.asunto, s.organismo, s.ambito, s.autor]
      |> Enum.map(&to_string/1)
      |> Enum.join(" ")
      |> String.downcase()

    String.contains?(haystack, String.downcase(q))
  end

  defp sort_key(s), do: {semaforo_rank(s.semaforo), s.dias_para_reclamar || 9999}

  defp semaforo_rank(:rojo), do: 0
  defp semaforo_rank(:ambar), do: 1
  defp semaforo_rank(:verde), do: 2
end
