# Rendimiento y feedback al usuario (latencia)

Cómo evitar esperas y, cuando las haya, **comunicarlas bien** — tanto en la skill (agente
Claude/Cursor) como en el chatbot web (Lovable).

## Principio base: el trabajo pesado va OFFLINE, no en el chat

Descargar el ZIP mensual de PLACSP y parsear CODICE/ATOM es lo lento (segundos a minutos). Por
diseño **no se hace durante la conversación**: lo hace el ETL (`etl_placsp.py`) una vez y deja el
JSON **cacheado** (en `data/` o en Supabase Storage). La consulta del usuario solo **filtra ese
JSON** → respuesta casi instantánea. En operación normal, por tanto, **no hay latencia de datos que
comunicar**; lo único que tarda es que el modelo redacte la explicación.

> Regla: nunca pongas una descarga/parseo de PLACSP en el camino crítico de un mensaje del usuario.

## De dónde puede venir, aun así, una espera

1. **El modelo redactando** (Gemini/Claude): 1–3 s típicos. Se cubre con *streaming*.
2. **Refrescar el caché** (re-correr el ETL para traer datos nuevos): de fondo, nunca bloquea el chat.
3. **Fetch en vivo del ATOM** (stretch del roadmap): si algún día se hace, puede tardar; tratarlo
   como job en segundo plano, no como respuesta síncrona.

## Feedback en la WEB (Lovable + edge function `chat`)

Estados que la UI debe saber pintar, de menor a mayor coste percibido:

- **Typing indicator / skeleton** en cuanto se envía el mensaje (el chat "está pensando").
- **Estado de herramienta**: mientras la edge function ejecuta `buscar_contratos`, mostrar un texto
  de estado tipo *"Buscando en la Plataforma de Contratación del Sector Público…"*. Tres fases:
  `pensando` → `consultando_fuente` → `redactando`.
- **Streaming de la respuesta**: Lovable AI permite *stream* de tokens; enséñalos según llegan. La
  percepción de velocidad mejora muchísimo aunque el total sea igual.
- **Respuesta en dos tiempos (opcional)**: acuse inmediato — *"Voy a buscar las obras de colegios del
  Ayuntamiento de Barcelona…"* — y luego las tarjetas de resultados.
- **Pre-warm**: la edge function carga el JSON de Storage **una vez** y lo cachea en memoria del
  worker; así la primera consulta no paga la lectura de Storage.
- **Errores/timeout**: mensaje claro + botón *reintentar*. Nunca dejar el spinner colgado.

### Estado en el contrato de respuesta de la edge function

Para que la UI pinte todo lo anterior y la procedencia del dato, la edge function `chat` devuelve:

```jsonc
{
  "reply": "explicación en markdown para el ciudadano",
  "contratos": [ /* items normalizados */ ],
  "fuente": {                       // viene de buscarContratos(...).fuente
    "es_demo": false,               // true => pintar banner de demo
    "aviso_ui": null,               // string => texto del banner; null => sin banner
    "fecha_cache": "2025-05-12",    // "Datos oficiales de PLACSP · actualizado el 12/05/2025"
    "fuente_oficial": "https://contrataciondelestado.es/…"
  },
  "estado": "ok"                    // "ok" | "sin_resultados" | "error"
}
```

La UI: si `fuente.aviso_ui` no es `null`, muestra el banner de demo; si es `null`, muestra solo
*"Datos oficiales de PLACSP · actualizado el {fecha_cache}"*. Así, datos reales cacheados = sin aviso.

### Si de verdad hay una operación larga lanzada por el usuario

Patrón **job + sondeo** (no bloquear el request):

1. La edge function arranca la tarea y devuelve `{ job_id, estado: "en_proceso" }`.
2. El front sondea (`GET estado/{job_id}`) **o** escucha **Supabase Realtime** para recibir el
   progreso empujado.
3. Mientras tanto, se sigue sirviendo el **caché anterior** con su `fecha_cache` visible.

## Feedback en la SKILL (runtime agente: Claude Code / Cursor)

- **Anuncia antes de esperar**: si vas a lanzar una operación que puede tardar (p.ej. descargar el
  ZIP mensual con el ETL), dilo primero — *"Voy a descargar el fichero mensual de PLACSP, puede
  tardar un poco…"* — y luego ejecútala.
- **Prefiere el caché**: consulta `data/contratos_demo.json` (o el dataset cacheado). Solo regenera
  con `etl_placsp.py` si el usuario pide datos frescos o el `fecha_cache` es viejo.
- **Progreso por stderr**: los scripts ya informan (`etl_placsp.py` imprime "Descargando …" y
  "Escritos N contratos …"). No silencies esos avisos en operaciones largas.

## Refresco del caché (cuándo y cómo)

- **Cadencia**: los datos abiertos de PLACSP son **mensuales**; refrescar más de una vez al mes no
  aporta. Un *job* programado (cron / scheduled function) que corra el ETL tras la publicación del
  mes es suficiente.
- **Siempre con fecha**: muestra `fecha_cache` en la UI para que el ciudadano sepa a qué fecha
  corresponde el dato. Es honesto y evita la sensación de "dato en vivo" que no es tal.
