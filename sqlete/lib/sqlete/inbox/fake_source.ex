defmodule SQLete.Inbox.FakeSource do
  @moduledoc """
  In-memory seed implementation of `SQLete.Inbox.Source` for the demo.

  Temporary: lets the frontend run end-to-end before the Ecto-backed source
  exists. Swap via `config :sqlete, :inbox_source, SQLete.Inbox.EctoSource`.

  It also applies a simplified version of the §7 deadline engine so the UI shows
  realistic estados, deadlines and semáforo. The real engine lives in the backend.
  """

  @behaviour SQLete.Inbox.Source

  alias SQLete.Inbox.Solicitud

  # Redistribution threshold: a parent with >= N children is a "1 → N" group.
  @redistribution_threshold 3

  @impl true
  def list_solicitudes(filters \\ %{}) do
    children = child_seeds()

    seeds()
    |> Enum.reject(& &1.parent_id)
    |> Enum.map(&with_children_count(&1, children))
    |> Enum.concat(children)
    |> apply_filters(filters)
    |> Enum.sort_by(&sort_key/1)
  end

  defp with_children_count(sol, children) do
    %{sol | children_count: Enum.count(children, &(&1.parent_id == sol.id))}
  end

  @impl true
  def get_solicitud!(id) do
    all = seeds() ++ child_seeds()

    case Enum.find(all, &(&1.id == id)) do
      nil ->
        raise Ecto.NoResultsError, queryable: Solicitud

      sol ->
        children = Enum.filter(all, &(&1.parent_id == id))
        parent = sol.parent_id && Enum.find(all, &(&1.id == sol.parent_id))

        %{
          sol
          | parent: parent,
            children: children,
            children_count: length(children),
            notificaciones: notificaciones_for(sol)
        }
    end
  end

  @impl true
  def list_redistribution_groups do
    all = seeds() ++ child_seeds()

    all
    |> Enum.filter(&(&1.parent_id == nil))
    |> Enum.map(fn parent ->
      children = Enum.filter(all, &(&1.parent_id == parent.id))
      %{parent: %{parent | children_count: length(children)}, children: children}
    end)
    |> Enum.filter(&(length(&1.children) >= @redistribution_threshold))
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

  # ----------------------------------------------------------------------------
  # Filtering / sorting
  # ----------------------------------------------------------------------------

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
    |> Enum.map(fn {k, v} -> {to_atom(k), blank_to_nil(v)} end)
    |> Enum.into(%{})
  end

  defp to_atom(k) when is_atom(k), do: k
  defp to_atom(k) when is_binary(k), do: String.to_existing_atom(k)

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

  # rojo first, then by days remaining
  defp sort_key(s), do: {semaforo_rank(s.semaforo), s.dias_para_reclamar || 9999}

  defp semaforo_rank(:rojo), do: 0
  defp semaforo_rank(:ambar), do: 1
  defp semaforo_rank(:verde), do: 2

  # ----------------------------------------------------------------------------
  # Seed data
  # ----------------------------------------------------------------------------

  defp seeds do
    today = Date.utc_today()

    [
      build(%{
        id: "exp-0001",
        external_id: "00001-00087725",
        ambito: "AGE",
        organismo: "Ministerio del Interior",
        asunto: "Datos de plantilla de la Policía Nacional por provincia",
        autor: "David",
        fecha_solicitud: Date.add(today, -55),
        inicio_tramitacion: Date.add(today, -50),
        estado: :en_plazo
      }),
      build(%{
        id: "exp-0002",
        external_id: "2024/2503283",
        ambito: "Cataluña",
        organismo: "Departament de Salut",
        asunto: "Listas de espera quirúrgicas por hospital",
        autor: "Ángela",
        fecha_solicitud: Date.add(today, -40),
        inicio_tramitacion: Date.add(today, -38),
        prorroga_20_1: Date.add(today, -10),
        estado: :en_plazo
      }),
      build(%{
        id: "exp-0003",
        external_id: "00045-00091200",
        ambito: "AGE",
        organismo: "Ministerio de Hacienda",
        asunto: "Ejecución presupuestaria de fondos Next Generation",
        autor: "Ter",
        fecha_solicitud: Date.add(today, -75),
        inicio_tramitacion: Date.add(today, -70),
        estado: :a_reclamar_silencio
      }),
      build(%{
        id: "exp-0004",
        external_id: "2023/0099817",
        ambito: "Madrid",
        organismo: "Consejería de Sanidad",
        asunto: "Contratos de emergencia COVID-19",
        autor: "Eva",
        fecha_solicitud: Date.add(today, -90),
        inicio_tramitacion: Date.add(today, -85),
        resolucion: Date.add(today, -20),
        notificacion: Date.add(today, -18),
        estado: :a_reclamar_incompleta
      }),
      build(%{
        id: "exp-0005",
        external_id: "00012-00088010",
        ambito: "Ayuntamiento de Madrid",
        organismo: "Área de Urbanismo",
        asunto: "Licencias de obra mayor concedidas en 2024",
        autor: "David",
        fecha_solicitud: Date.add(today, -120),
        inicio_tramitacion: Date.add(today, -115),
        resolucion: Date.add(today, -80),
        notificacion: Date.add(today, -78),
        estado: :resuelta
      }),
      build(%{
        id: "exp-0006",
        external_id: "R-CTBG-2024-0712",
        ambito: "AGE",
        organismo: "Ministerio de Transportes",
        asunto: "Inversiones en cercanías ferroviarias",
        autor: "Ángela",
        fecha_solicitud: Date.add(today, -160),
        inicio_tramitacion: Date.add(today, -155),
        reclamacion_ref: "R CTBG 2024-0712",
        estado: :reclamada
      }),
      build(%{
        id: "exp-0007",
        external_id: "00031-00090455",
        ambito: "Galicia",
        organismo: "Consellería de Facenda",
        asunto: "Subvenciones a medios de comunicación 2022-2024",
        autor: "Ter",
        fecha_solicitud: Date.add(today, -210),
        inicio_tramitacion: Date.add(today, -205),
        reclamacion_ref: "R CTBG 2024-0441",
        estado: :ganado_sin_info
      }),
      build(%{
        id: "exp-0008",
        external_id: "2024/2510999",
        ambito: "AGE",
        organismo: "Ministerio de Justicia",
        asunto: "Estadística de indultos concedidos 2018-2024",
        autor: "Eva",
        fecha_solicitud: Date.add(today, -33),
        inicio_tramitacion: Date.add(today, -31),
        estado: :en_plazo
      }),
      # Demo-only rows so the digest cards 🟠 (reclamadas) and 🔵 (contencioso) are
      # visibly populated. `compute_estado` never derives :contencioso, so without a
      # seed that card would always be empty in the demo. Not present in EctoSource.
      build(%{
        id: "exp-0009",
        external_id: "00001-00081530",
        ambito: "AGE",
        organismo: "Ministerio de Inclusión, Seguridad Social y Migraciones",
        asunto: "Solicitudes de acceso a la nacionalidad española",
        autor: "Ter",
        fecha_solicitud: Date.add(today, -240),
        inicio_tramitacion: Date.add(today, -235),
        reclamacion_ref: "2023-E-RE-2730",
        estado: :contencioso
      }),
      build(%{
        id: "exp-0010",
        external_id: "2024/2510888",
        ambito: "AGE",
        organismo: "Ministerio de Hacienda",
        asunto: "Beneficios fiscales a grandes patrimonios 2020-2024",
        autor: "Eva",
        fecha_solicitud: Date.add(today, -140),
        inicio_tramitacion: Date.add(today, -135),
        reclamacion_ref: "R CTBG 2024-0980",
        estado: :reclamada
      }),
      # Parent of a redistribution group (1 solicitud → N expedientes)
      build(%{
        id: "exp-0100",
        external_id: "00050-00092000",
        ambito: "AGE",
        organismo: "Varios ministerios",
        asunto: "Gasto en publicidad institucional por ministerio (2024)",
        autor: "David",
        fecha_solicitud: Date.add(today, -60),
        inicio_tramitacion: Date.add(today, -58),
        notas: "Solicitud única redistribuida a varios ministerios.",
        estado: :en_plazo
      })
    ]
  end

  # Children of exp-0100 (the redistribution group)
  defp child_seeds do
    today = Date.utc_today()
    parent_id = "exp-0100"

    [
      {"exp-0101", "Ministerio de Hacienda", :en_plazo, -58, nil},
      {"exp-0102", "Ministerio del Interior", :a_reclamar_silencio, -58, nil},
      {"exp-0103", "Ministerio de Sanidad", :resuelta, -58, -20},
      {"exp-0104", "Ministerio de Defensa", :en_plazo, -40, nil},
      {"exp-0105", "Ministerio de Cultura", :en_plazo, -58, nil}
    ]
    |> Enum.with_index(1)
    |> Enum.map(fn {{id, organismo, estado, inicio_offset, res_offset}, idx} ->
      build(%{
        id: id,
        external_id: "00050-0009200#{idx}",
        ambito: "AGE",
        organismo: organismo,
        asunto: "Gasto en publicidad institucional (#{organismo})",
        autor: "David",
        fecha_solicitud: Date.add(today, -60),
        inicio_tramitacion: Date.add(today, inicio_offset),
        resolucion: res_offset && Date.add(today, res_offset),
        notificacion: res_offset && Date.add(today, res_offset + 2),
        parent_id: parent_id,
        estado: estado
      })
    end)
  end

  defp notificaciones_for(sol) do
    base = [
      %{
        tipo: :inicio_tramitacion,
        fecha_notificacion: sol.inicio_tramitacion,
        llm_confidence: 0.97
      }
    ]

    base
    |> maybe_add(sol.prorroga_20_1, %{
      tipo: :prorroga,
      fecha_notificacion: sol.prorroga_20_1,
      llm_confidence: 0.92
    })
    |> maybe_add(sol.resolucion, %{
      tipo: :resolucion_completa,
      fecha_notificacion: sol.notificacion || sol.resolucion,
      llm_confidence: 0.88
    })
    |> Enum.reject(&is_nil(&1.fecha_notificacion))
    |> Enum.sort_by(& &1.fecha_notificacion, Date)
  end

  defp maybe_add(list, nil, _item), do: list
  defp maybe_add(list, _present, item), do: list ++ [item]

  # ----------------------------------------------------------------------------
  # Simplified §7 deadline engine (real one lives in the backend)
  # ----------------------------------------------------------------------------

  defp build(attrs) do
    today = Date.utc_today()

    vencimiento_efectivo =
      cond do
        attrs[:prorroga_20_1] -> add_months(attrs.inicio_tramitacion, 2)
        attrs[:inicio_tramitacion] -> add_months(attrs.inicio_tramitacion, 1)
        true -> nil
      end

    fecha_limite =
      cond do
        attrs[:estado] == :a_reclamar_incompleta and attrs[:notificacion] ->
          add_months(attrs.notificacion, 1)

        attrs[:estado] == :a_reclamar_silencio and vencimiento_efectivo ->
          add_months(vencimiento_efectivo, 1)

        true ->
          nil
      end

    dias = fecha_limite && Date.diff(fecha_limite, today)
    dias_vencer = vencimiento_efectivo && Date.diff(vencimiento_efectivo, today)

    struct(Solicitud, %{
      id: attrs.id,
      external_id: attrs.external_id,
      ambito: attrs[:ambito],
      fecha_solicitud: attrs[:fecha_solicitud],
      asunto: attrs[:asunto],
      organismo: attrs[:organismo],
      inicio_tramitacion: attrs[:inicio_tramitacion],
      prorroga_20_1: attrs[:prorroga_20_1],
      resolucion: attrs[:resolucion],
      notificacion: attrs[:notificacion],
      notas: attrs[:notas],
      autor: attrs[:autor],
      reclamacion_ref: attrs[:reclamacion_ref],
      parent_id: attrs[:parent_id],
      estado: attrs[:estado],
      vencimiento_efectivo: vencimiento_efectivo,
      fecha_limite_reclamacion_ctbg: fecha_limite,
      dias_para_reclamar: dias,
      dias_para_vencer: dias_vencer,
      semaforo: semaforo(attrs[:estado], dias)
    })
  end

  defp semaforo(estado, _dias) when estado in [:resuelta, :ganado_sin_info], do: :verde

  defp semaforo(estado, dias)
       when estado in [:a_reclamar_silencio, :a_reclamar_incompleta] do
    cond do
      is_integer(dias) and dias <= 3 -> :rojo
      is_integer(dias) and dias <= 10 -> :ambar
      true -> :rojo
    end
  end

  defp semaforo(_estado, dias) do
    cond do
      is_integer(dias) and dias <= 3 -> :rojo
      is_integer(dias) and dias <= 10 -> :ambar
      true -> :verde
    end
  end

  # Add `n` calendar months to a date, clamping the day to the target month length.
  defp add_months(%Date{} = date, n) do
    months = date.year * 12 + (date.month - 1) + n
    year = div(months, 12)
    month = rem(months, 12) + 1
    day = min(date.day, Date.days_in_month(%Date{year: year, month: month, day: 1}))
    Date.new!(year, month, day)
  end

  defp add_months(nil, _n), do: nil
end
