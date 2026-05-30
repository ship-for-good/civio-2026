defmodule SQLete.Documents.FieldExtractor do
  @moduledoc """
  Single-shot structured extraction of the expediente fields the dashboard needs,
  straight from the PDF text.

  One LLM call per document returns a strict JSON object that maps onto the
  `document_files` columns (doc_type, organismo, dates, expediente_id, ...). This
  is deliberately independent of the GraphRAG pipeline: the dashboard reads these
  columns directly, so a graph/LLM hiccup never leaves the frontend empty.

  Talks to the OpenAI-compatible chat API directly (Req) so we fully control the
  gpt-5 quirks: `max_completion_tokens` (not `max_tokens`), no custom
  `temperature` (only the default is allowed), and JSON response format.
  """

  require Logger

  # These documents carry the identifying fields in the header and the
  # sentido/fallo (RESUELVE) at the very end, with boilerplate in between. Send a
  # head+tail window so we capture both without paying for the whole body.
  @head_chars 11_000
  @tail_chars 6_000
  @max_completion_tokens 4_000

  @doc_types ~w(reclamacion_ctbg resolucion_estimatoria resolucion_desestimatoria
                resolucion_parcial inicio_tramitacion prorroga guia otro)
  @ambitos ~w(AGE autonomico local)
  @sentidos ~w(estimatoria desestimatoria inadmision parcial)

  @type fields :: %{optional(atom()) => String.t() | Date.t() | nil}

  @spec extract(String.t()) :: {:ok, fields()} | {:error, term()}
  def extract(text) when is_binary(text) do
    with {:ok, content} <- complete(prompt(text)),
         {:ok, raw} <- decode(content) do
      {:ok, normalize(raw)}
    end
  end

  # ---------------------------------------------------------------------------
  # LLM call
  # ---------------------------------------------------------------------------

  defp complete(user_prompt) do
    config = Application.get_env(:sqlete, :llm, [])

    case Keyword.get(config, :api_key) do
      key when is_binary(key) and key != "" ->
        request(user_prompt, config, key)

      _ ->
        Logger.error(
          "FieldExtractor: OPENAI_API_KEY is not set — start the server with the .env loaded"
        )

        {:error, :missing_api_key}
    end
  end

  defp request(user_prompt, config, api_key) do
    url = base_url(config) <> "/chat/completions"

    body = %{
      model: Keyword.get(config, :model, "gpt-5-mini"),
      messages: [
        %{role: "system", content: system_prompt()},
        %{role: "user", content: user_prompt}
      ],
      response_format: %{type: "json_object"},
      max_completion_tokens: @max_completion_tokens
    }

    timeout = Keyword.get(config, :timeout, 120_000)

    url
    |> Req.post(json: body, auth: {:bearer, api_key}, receive_timeout: timeout, retry: :transient)
    |> handle_response()
  rescue
    error ->
      Logger.error("FieldExtractor request crashed: #{inspect(error)}")
      {:error, {:request_crashed, Exception.message(error)}}
  end

  defp handle_response(
         {:ok,
          %Req.Response{
            status: 200,
            body: %{"choices" => [%{"message" => %{"content" => c}} | _]}
          }}
       ),
       do: {:ok, c}

  defp handle_response({:ok, %Req.Response{status: status, body: body}}) do
    Logger.error("FieldExtractor LLM error #{status}: #{inspect(body)}")
    {:error, {:llm_http_error, status}}
  end

  defp handle_response({:error, reason}) do
    Logger.error("FieldExtractor LLM transport error: #{inspect(reason)}")
    {:error, reason}
  end

  defp base_url(config) do
    config
    |> Keyword.get(:base_url, "https://api.openai.com")
    |> String.trim_trailing("/")
    |> then(fn url -> if String.ends_with?(url, "/v1"), do: url, else: url <> "/v1" end)
  end

  # ---------------------------------------------------------------------------
  # Prompt
  # ---------------------------------------------------------------------------

  defp system_prompt do
    """
    Eres un analista de expedientes del derecho de acceso a la información pública \
    (Ley 19/2013, LTAIBG). Lees notificaciones y resoluciones administrativas \
    españolas —incluidas resoluciones del Consejo de Transparencia y Buen Gobierno \
    (CTBG)— y extraes sus datos clave de forma estructurada.

    Reglas:
    - Extrae SOLO lo que aparezca explícita o muy claramente en el texto. No inventes.
    - Si un dato no aparece, usa null. Nunca rellenes con suposiciones.
    - Las fechas SIEMPRE en formato ISO "YYYY-MM-DD". Si solo hay mes/año, usa el día 01.
    - Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional ni markdown.
    """
  end

  defp prompt(text) do
    """
    Analiza la siguiente notificación/resolución y devuelve un JSON con estos campos:

    {
      "doc_type": uno de [#{Enum.join(@doc_types, ", ")}] según el tipo de documento,
      "ambito": uno de [AGE, autonomico, local] según la administración actuante (AGE = Administración General del Estado),
      "organismo": nombre del órgano/administración que tramita o resuelve (ministerio, consejería, ayuntamiento, CTBG...),
      "asunto": resumen muy breve (máx. ~12 palabras) de la información solicitada,
      "expediente_id": UN ÚNICO identificador del expediente del ORGANISMO que tramitó la solicitud (p. ej. el S/REF o el nº de registro de la solicitud, "2312-2023", "001-00110876"). No mezcles aquí la referencia de la reclamación del CTBG ni varios códigos,
      "expediente_padre": expediente MATRIZ del que deriva esta solicitud por redistribución, cuando el texto indique que "trae causa de", "se ha redistribuido desde", "deriva de" o "es remitida desde" otra solicitud/expediente matriz. Si no hay redistribución, null,
      "reclamacion_ref": UN ÚNICO identificador de la reclamación ante el CTBG si se cita (el N/REF, p. ej. "R-0542-2017"); si el documento no es ni cita una reclamación al CTBG, null,
      "resolucion_sentido": uno de [estimatoria, desestimatoria, inadmision, parcial] o null,
      "autor": nombre del solicitante/reclamante si consta (suele venir anonimizado → null),
      "fecha_solicitud": fecha en que se presentó la solicitud de acceso inicial,
      "inicio_tramitacion": fecha de inicio de tramitación o de acuse/admisión por el organismo,
      "prorroga": fecha en que el ORGANISMO amplió el plazo de resolución (art. 20.1 LTAIBG). Solo si el propio organismo declaró la ampliación; en resoluciones o reclamaciones del CTBG normalmente es null,
      "resolucion": fecha de la resolución,
      "notificacion": fecha de notificación de la resolución al interesado
    }

    Contexto legal útil para clasificar:
    - El organismo tiene 1 mes para resolver (ampliable otro mes por prórroga del art. 20.1).
    - Si no resuelve en plazo hay silencio y cabe reclamación ante el CTBG en 1 mes.
    - "reclamacion_ctbg" = el documento es una reclamación/resolución del CTBG.
    - "resolucion_estimatoria/desestimatoria/parcial" = resolución del organismo según conceda, deniegue o conceda en parte.

    El texto puede venir recortado por el centro (marcado con [...]); los datos
    relevantes están al principio (encabezado) y al final (parte dispositiva/RESUELVE).

    Texto:
    \"\"\"
    #{window(text)}
    \"\"\"
    """
  end

  # Header + tail window: keeps the identifying header and the final RESUELVE
  # (sentido) for long resolutions, dropping the boilerplate middle.
  defp window(text) do
    if String.length(text) <= @head_chars + @tail_chars do
      text
    else
      head = String.slice(text, 0, @head_chars)
      tail = String.slice(text, -@tail_chars, @tail_chars)
      head <> "\n\n[...]\n\n" <> tail
    end
  end

  # ---------------------------------------------------------------------------
  # Parsing / normalization
  # ---------------------------------------------------------------------------

  defp decode(content) when is_binary(content) do
    cleaned =
      content
      |> String.trim()
      |> String.replace(~r/^```json\n?/, "")
      |> String.replace(~r/\n?```$/, "")
      |> String.trim()

    case Jason.decode(cleaned) do
      {:ok, map} when is_map(map) -> {:ok, map}
      {:ok, _other} -> {:error, :unexpected_json}
      {:error, reason} -> {:error, {:json_decode, reason}}
    end
  end

  defp normalize(raw) do
    %{
      doc_type: enum(raw["doc_type"], @doc_types),
      ambito: enum(raw["ambito"], @ambitos),
      organismo: string(raw["organismo"]),
      asunto: string(raw["asunto"]),
      expediente_id: string(raw["expediente_id"]),
      expediente_padre: string(raw["expediente_padre"]),
      reclamacion_ref: string(raw["reclamacion_ref"]),
      resolucion_sentido: enum(raw["resolucion_sentido"], @sentidos),
      autor: string(raw["autor"]),
      fecha: date(raw["fecha_solicitud"]),
      inicio_tramitacion: date(raw["inicio_tramitacion"]),
      prorroga: date(raw["prorroga"]),
      resolucion: date(raw["resolucion"]),
      notificacion: date(raw["notificacion"])
    }
    |> Enum.reject(fn {_k, v} -> is_nil(v) end)
    |> Map.new()
  end

  defp string(value) when is_binary(value) do
    case String.trim(value) do
      "" -> nil
      trimmed -> trimmed
    end
  end

  defp string(_), do: nil

  defp enum(value, allowed) when is_binary(value) do
    normalized = value |> String.trim() |> String.downcase()

    cond do
      normalized in Enum.map(allowed, &String.downcase/1) ->
        Enum.find(allowed, &(String.downcase(&1) == normalized))

      true ->
        nil
    end
  end

  defp enum(_, _), do: nil

  defp date(value) when is_binary(value) do
    case String.split(String.trim(value), "-") do
      [y, m, d] -> to_date(y, m, d)
      [y, m] -> to_date(y, m, "1")
      [y] when byte_size(y) == 4 -> to_date(y, "1", "1")
      _ -> nil
    end
  end

  defp date(_), do: nil

  defp to_date(y, m, d) do
    with {year, ""} <- Integer.parse(y),
         {month, ""} <- Integer.parse(m),
         {day, ""} <- Integer.parse(String.slice(d, 0, 2)),
         {:ok, date} <- Date.new(year, month, day) do
      date
    else
      _ -> nil
    end
  end
end
