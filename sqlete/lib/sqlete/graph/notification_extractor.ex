defmodule SQLete.Graph.NotificationExtractor do
  @moduledoc """
  Combined entity and relationship extractor for transparency-request notices.

  The prompt is tuned for official Spanish administrative notifications so
  SQLete can keep request state, deadlines, references, and legal bases in a
  graph aligned with newsroom workflow.
  """

  @behaviour Arcana.Graph.GraphExtractor

  @entity_types [
    "request_case",
    "authority",
    "requester",
    "representative",
    "document_notice",
    "file_reference",
    "date",
    "deadline",
    "resolution",
    "status",
    "law_article",
    "information_subject",
    "organization",
    "action"
  ]

  @relationship_types [
    "FILED_BY",
    "ADDRESSED_TO",
    "ISSUED_BY",
    "REFERENCES_FILE",
    "RESPONDS_TO",
    "NOTIFIES_ON",
    "SETS_DEADLINE",
    "EXTENDS_DEADLINE",
    "CITES_LEGAL_BASIS",
    "CHANGES_STATUS_TO",
    "REDIRECTED_TO",
    "REQUIRES_ACTION",
    "ABOUT_SUBJECT",
    "INVOLVES_ORGANIZATION",
    "APPEALABLE_TO"
  ]

  @impl true
  @spec extract(String.t(), keyword()) ::
          {:ok, %{entities: [map()], relationships: [map()]}} | {:error, term()}
  def extract(text, opts) when is_binary(text) do
    llm = Keyword.fetch!(opts, :llm)
    prompt = build_prompt(text)

    :telemetry.span([:arcana, :graph, :extraction], %{text: text}, fn ->
      result =
        case Arcana.LLM.complete(llm, prompt, [],
               system_prompt: system_prompt(),
               temperature: 0.1
             ) do
          {:ok, response} -> parse_and_validate(response)
          {:error, reason} -> {:error, reason}
        end

      metadata =
        case result do
          {:ok, data} ->
            %{entity_count: length(data.entities), relationship_count: length(data.relationships)}

          {:error, _reason} ->
            %{entity_count: 0, relationship_count: 0}
        end

      {result, metadata}
    end)
  end

  @spec build_prompt(String.t()) :: String.t()
  def build_prompt(text) do
    entity_types = Enum.join(@entity_types, ", ")
    relationship_types = Enum.join(@relationship_types, ", ")

    """
    Extrae entidades y relaciones de una notificación administrativa relacionada con una solicitud de acceso a la información.

    El objetivo es estructurar expedientes, plazos y acciones para el flujo editorial de SQLete.
    Trabaja solo con información que aparezca de forma explícita o muy claramente inferible en el texto.
    No inventes entidades, relaciones, fechas, artículos legales ni acciones.

    ## Texto a analizar:
    #{text}

    ## Tipos de entidades permitidos:
    #{entity_types}

    ## Definiciones de entidades:
    - request_case: la solicitud, expediente o caso principal.
    - authority: la administración, ministerio, consejería, ayuntamiento u organismo público que tramita o responde.
    - requester: la persona física o jurídica que presenta la solicitud.
    - representative: la persona que actúa en nombre del solicitante.
    - document_notice: la resolución, requerimiento, comunicación, acuse o notificación concreta.
    - file_reference: identificadores de expediente, número de solicitud, referencia interna o códigos similares.
    - date: una fecha concreta relevante para el procedimiento.
    - deadline: un plazo legal o administrativo explícito.
    - resolution: el contenido resolutivo o resultado material (inadmisión, concesión parcial, ampliación, redistribución, etc.).
    - status: el estado procesal del caso (pendiente, inadmitido, resuelto, ampliado, redistribuido, etc.).
    - law_article: una ley, artículo, reglamento o fundamento jurídico citado.
    - information_subject: la materia o información solicitada.
    - organization: otros organismos o entidades relevantes, como CTBG, órganos superiores o terceros afectados.
    - action: una acción explícita o claramente indicada para seguir el caso (reclamar, subsanar, aportar documentación, esperar respuesta, etc.).

    ## Metadatos útiles:
    - Para date, usa metadata.kind cuando se pueda distinguir (filing_date, notification_date, resolution_date, extension_date, appeal_date).
    - Para deadline, usa metadata.kind y, si aparece, metadata.days, metadata.business_days, metadata.start_date o metadata.end_date.
    - Para resolution y status, usa metadata.normalized_value cuando puedas normalizar el resultado.
    - Para file_reference, usa metadata.reference_kind si el texto distingue entre expediente, solicitud, registro u otro código.

    ## Tipos de relaciones permitidos:
    #{relationship_types}

    ## Definiciones de relaciones:
    - FILED_BY: el caso fue presentado por una persona u organización.
    - ADDRESSED_TO: la solicitud o documento va dirigido a una autoridad.
    - ISSUED_BY: una notificación o resolución fue emitida por una autoridad u organismo.
    - REFERENCES_FILE: una entidad menciona una referencia o expediente.
    - RESPONDS_TO: una resolución o notificación responde a una solicitud o caso.
    - NOTIFIES_ON: vincula un documento o resolución con una fecha de notificación o emisión.
    - SETS_DEADLINE: fija un plazo para responder, recurrir, subsanar o actuar.
    - EXTENDS_DEADLINE: una resolución amplía un plazo existente.
    - CITES_LEGAL_BASIS: vincula una resolución o actuación con una norma o artículo.
    - CHANGES_STATUS_TO: indica que el caso pasa a un estado concreto.
    - REDIRECTED_TO: la solicitud o expediente se remite a otro organismo.
    - REQUIRES_ACTION: el caso o resolución exige una acción posterior.
    - ABOUT_SUBJECT: la solicitud o resolución trata sobre una materia informativa concreta.
    - INVOLVES_ORGANIZATION: relación general con otro organismo relevante.
    - APPEALABLE_TO: indica ante qué organismo puede recurrirse una decisión.

    ## Instrucciones:
    1. Identifica primero el request_case principal si existe.
    2. Prioriza autoridades, referencias de expediente, fechas y plazos porque son críticos para seguimiento.
    3. Si varias fechas aparecen, sepáralas como entidades distintas cuando cumplan funciones distintas.
    4. Usa relaciones solo entre entidades presentes en la salida.
    5. Usa `strength` 9 o 10 para relaciones explícitas en el texto; 6 a 8 para relaciones muy claras pero menos directas.
    6. Mantén los nombres cortos y fieles al documento.
    7. Devuelve JSON válido únicamente.

    ## Formato de salida:
    ```json
    {
      "entities": [
        {
          "name": "Entidad",
          "type": "request_case",
          "description": "Contexto breve",
          "metadata": {"normalized_value": "..."}
        }
      ],
      "relationships": [
        {
          "source": "Entidad origen",
          "target": "Entidad destino",
          "type": "RELATIONSHIP_TYPE",
          "description": "Contexto breve",
          "strength": 9,
          "metadata": {"kind": "..."}
        }
      ]
    }
    ```
    """
  end

  defp system_prompt do
    """
    Eres un extractor de grafo de conocimiento para notificaciones oficiales de solicitudes de acceso a la información.
    Debes identificar expedientes, autoridades, fechas, plazos, resoluciones y bases legales con precisión.
    Devuelve siempre JSON válido y evita inferencias especulativas.
    """
  end

  defp parse_and_validate(response) do
    cleaned =
      response
      |> String.trim()
      |> String.replace(~r/^```json\n?/, "")
      |> String.replace(~r/\n?```$/, "")
      |> String.trim()

    case Jason.decode(cleaned) do
      {:ok, %{"entities" => entities, "relationships" => relationships}}
      when is_list(entities) and is_list(relationships) ->
        normalized_entities = Enum.map(entities, &normalize_entity/1)
        valid_entities = Enum.filter(normalized_entities, &valid_entity?/1)
        entity_names = MapSet.new(valid_entities, & &1.name)

        valid_relationships =
          relationships
          |> Enum.map(&normalize_relationship/1)
          |> Enum.filter(&valid_relationship?(&1, entity_names))

        {:ok, %{entities: valid_entities, relationships: valid_relationships}}

      {:ok, _other} ->
        {:error,
         {:json_parse_error, "Expected object with 'entities' and 'relationships' arrays"}}

      {:error, error} ->
        {:error, {:json_parse_error, error}}
    end
  end

  defp normalize_entity(entity) when is_map(entity) do
    %{
      name: normalize_name(Map.get(entity, "name")),
      type: normalize_entity_type(Map.get(entity, "type")),
      description: normalize_description(Map.get(entity, "description")),
      metadata: normalize_metadata(Map.get(entity, "metadata", %{}))
    }
  end

  defp normalize_entity(_other) do
    %{name: nil, type: "other", description: nil, metadata: %{}}
  end

  defp normalize_relationship(relationship) when is_map(relationship) do
    %{
      source: normalize_name(Map.get(relationship, "source")),
      target: normalize_name(Map.get(relationship, "target")),
      type: normalize_relationship_type(Map.get(relationship, "type")),
      description: normalize_description(Map.get(relationship, "description")),
      strength: normalize_strength(Map.get(relationship, "strength")),
      metadata: normalize_metadata(Map.get(relationship, "metadata", %{}))
    }
  end

  defp normalize_relationship(_other) do
    %{
      source: nil,
      target: nil,
      type: "RELATED_TO",
      description: nil,
      strength: nil,
      metadata: %{}
    }
  end

  defp valid_entity?(%{name: name, type: type}) do
    is_binary(name) and name != "" and is_binary(type) and type != "other"
  end

  defp valid_relationship?(%{source: source, target: target, type: type}, entity_names) do
    is_binary(source) and
      is_binary(target) and
      is_binary(type) and
      source != target and
      MapSet.member?(entity_names, source) and
      MapSet.member?(entity_names, target)
  end

  defp normalize_name(nil), do: nil
  defp normalize_name(value) when is_binary(value), do: truncate_string(String.trim(value), 250)

  defp normalize_name(value) when is_atom(value) or is_number(value),
    do: normalize_name(to_string(value))

  defp normalize_name(_other), do: nil

  defp normalize_description(nil), do: nil

  defp normalize_description(value) when is_binary(value),
    do: truncate_string(String.trim(value), 500)

  defp normalize_description(value) when is_atom(value) or is_number(value),
    do: normalize_description(to_string(value))

  defp normalize_description(_other), do: nil

  defp normalize_entity_type(nil), do: "other"

  defp normalize_entity_type(type) when is_binary(type) do
    normalized =
      type
      |> String.downcase()
      |> String.replace(~r/[^a-z_]/, "")

    if normalized in @entity_types, do: normalized, else: "other"
  end

  defp normalize_entity_type(_other), do: "other"

  defp normalize_relationship_type(nil), do: "RELATED_TO"

  defp normalize_relationship_type(type) when is_binary(type) do
    normalized =
      type
      |> String.upcase()
      |> String.replace(~r/[^A-Z0-9_]/, "_")
      |> String.replace(~r/_+/, "_")
      |> String.trim("_")

    if normalized in @relationship_types, do: normalized, else: "RELATED_TO"
  end

  defp normalize_relationship_type(_other), do: "RELATED_TO"

  defp normalize_strength(nil), do: nil

  defp normalize_strength(strength) when is_integer(strength) do
    strength
    |> max(1)
    |> min(10)
  end

  defp normalize_strength(strength) when is_float(strength) do
    strength
    |> round()
    |> normalize_strength()
  end

  defp normalize_strength(strength) when is_binary(strength) do
    case Integer.parse(strength) do
      {value, ""} -> normalize_strength(value)
      _other -> nil
    end
  end

  defp normalize_strength(_other), do: nil

  defp normalize_metadata(metadata) when is_map(metadata) do
    Map.new(metadata, fn {key, value} ->
      {normalize_metadata_key(key), normalize_metadata_value(value)}
    end)
  end

  defp normalize_metadata(_other), do: %{}

  defp normalize_metadata_key(key) when is_binary(key), do: key
  defp normalize_metadata_key(key) when is_atom(key), do: Atom.to_string(key)
  defp normalize_metadata_key(key), do: inspect(key)

  defp normalize_metadata_value(value) when is_map(value), do: normalize_metadata(value)

  defp normalize_metadata_value(value) when is_list(value) do
    Enum.map(value, &normalize_metadata_value/1)
  end

  defp normalize_metadata_value(value), do: value

  defp truncate_string(nil, _max_length), do: nil

  defp truncate_string(value, max_length) when is_binary(value) do
    if String.length(value) > max_length do
      String.slice(value, 0, max_length - 3) <> "..."
    else
      value
    end
  end
end
