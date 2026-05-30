# Plan — Skill "Transparencia ES" + Chatbot ciudadano (Hackathon Ship for Good / CIVIO)

## Contexto (por qué hacemos esto)

En España, la respuesta oficial a "¿dónde encuentro información pública?" es "ve al Portal de
Transparencia". Pero ese portal es, en gran parte, **un directorio de enlaces** a otros portales: te
deriva a una docena de sistemas distintos sin curación ni consistencia. CIVIO se lo salta y va a las
**fuentes primarias** (contratos → PLACSP; subvenciones → BDNS; bienes de altos cargos → BOE;
retribuciones → el propio portal). Ese conocimiento de "dónde buscar y cómo" es **tácito**: vive en
las cabezas del equipo, no está escrito, y es inaccesible para el ciudadano —que ni sabe que existe
el Portal de Contratación, ni conoce el vocabulario técnico (códigos CPV, tipos de contrato,
expediente) que hace falta para usarlo.

Esto es la oportunidad **OPP-1a** del `challenge-discovery.md`: el cuello de botella más frecuente y
el de mayor impacto potencial para el ciudadano. **Resultado buscado:** sistematizar ese
conocimiento tácito en una *skill* reutilizable que permita a una IA llevar a cualquier persona a la
fuente correcta, y enseñarlo en un chatbot web con buena UX.

### Decisiones de producto (confirmadas con el equipo)
- **Alcance v1: una sola vertical en profundidad → Contratos públicos (PLACSP).** El resto de
  verticales se documenta como *roadmap*, no se implementa (tenemos ~5h).
- **Datos en vivo: sí.** No solo guía: trae **datos reales** de contratación y los explica en lenguaje
  entendible, **enlazando siempre al expediente oficial**.
- **Caso estrella de la demo:** *"¿En qué se gastó mi ayuntamiento / cuánto costó esta obra?"* →
  el chat lleva a PLACSP con el CPV correcto y muestra contratos reales explicados.
- **Todo el producto web se construye dentro de Lovable** (frontend + backend + IA), sin servidor
  Node/Python aparte. Ver arquitectura.

### Principio de diseño no negociable (Política de IA de Civio)
El sistema **enruta, extrae, normaliza y explica** datos públicos con cita a la fuente. **Nunca**
genera texto periodístico, interpretación editorial, documentos legales, ni inventa datos. Regla de
oro: *"toda afirmación va acompañada del enlace oficial; si no hay dato oficial, se dice que no lo
hay"*. Extracción/normalización/consulta de datos abiertos **sí** está permitida por la política.

### Realidad técnica (verificada) — importante
- **PLACSP (contrataciondelestado.es → Datos Abiertos)**: **no hay API REST en tiempo real**. Los
  datos abiertos son ficheros mensuales **ZIP + ATOM** (cada `.atom` máx. 500 entradas, encadenadas
  con `<link rel="next">`), formato **CODICE 2.07**. Existe la herramienta oficial *OpenPLACSP*.
  → Estrategia: **parsear UNA vez** un trozo reciente del open data (ETL offline) y dejarlo como JSON
  limpio; el chat filtra sobre ese JSON. Determinista, rápido y a prueba de WiFi del recinto.
- **Lovable Cloud** = backend sobre **Supabase**: base de datos, **Storage**, secrets y **Edge
  Functions** (TypeScript/Deno) para lógica propia y llamadas a APIs externas; se generan y despliegan
  desde el chat de Lovable.
- **Lovable AI** = IA integrada, **sin API keys**, modelo por defecto **Gemini 3 Flash**, con
  **function calling**. (Verificar el consumo contra los créditos del plan Pro del evento; si se
  agotaran, alternativa: API key propia de Google Gemini —free tier ~1.500 req/día— en un secret.)
- Otras verticales (solo roadmap): **BDNS** (subvenciones) sí tiene API REST pública sin auth;
  **BOE** tiene API de datos abiertos (sumario); **datos.gob.es** es CKAN con SPARQL.

---

## Arquitectura (todo dentro de Lovable + la skill como cerebro portable)

```
[ Lovable Frontend: chat UI ciudadano ]
        │  invoke edge function  chat({ mensaje, historial })
        ▼
[ Lovable Cloud · Supabase Edge Function "chat" (TS/Deno) ]
        │  - system prompt = contenido de la SKILL (SKILL.md + references)
        │  - Lovable AI (Gemini 3 Flash) con FUNCTION CALLING
        │  - declara 1 tool: buscar_contratos(organo, cpv?, anio?)
        ▼
[ Edge Function / lógica "buscar_contratos" ]
        │  lee contratos_demo.json (Supabase Storage) y filtra por organo + cpv
        ▼  JSON normalizado → el modelo explica en lenguaje claro + enlaza el expediente
```

La **skill es el cerebro** y tiene **doble vida**:
1. **Artefacto open-source** instalable en Claude Code / Cursor (`SKILL.md` + `references/` + script
   de ejemplo). Agnóstica del modelo.
2. **Contexto/system prompt** de la edge function `chat` del producto web (corriendo sobre Gemini vía
   Lovable AI). El mismo conocimiento, distinto runtime.

> Nota clave de diseño: el **modelo del web es Gemini** (Lovable AI), no Claude. La skill es solo
> "system prompt + una herramienta", así que funciona igual; y el artefacto open-source se sigue
> usando con Claude/cualquier agente. El runtime de datos es **TypeScript/Deno** (edge function), por
> lo que el **parseo CODICE/ATOM se hace una sola vez offline** (puede ser Python) y la edge function
> solo **filtra el JSON ya limpio** — así evitamos duplicar el parser bajo presión de tiempo.

**Trabajo en paralelo desde el minuto 0:** se congela el **contrato de datos** (forma del
`contratos_demo.json` y de la respuesta del chat, ver abajo). UI y edge function se construyen contra
ese contrato con datos mock mientras el ETL produce los reales.

---

## La skill v1 — estructura de ficheros

Formato estándar de Claude Agent Skill (frontmatter YAML + *progressive disclosure*). `SKILL.md`
**corto**; el detalle va en `references/` que se cargan bajo demanda.

```
skills/transparencia-es/
├── SKILL.md                  # name + description (disparador) + cuándo usar + flujo + reglas de oro
├── references/
│   ├── contratos.md          # PLACSP: qué es, cuándo, cómo buscar, parámetros, datos abiertos, ejemplos
│   ├── glosario-cpv.md       # CPV explicado + tabla de CPV frecuentes (obras, servicios, suministros)
│   ├── tipos-contrato.md     # servicio / suministro / obra / contrato menor — qué significan
│   ├── mapa-fuentes.md       # tabla "qué info → dónde vive de verdad" (las 4 verticales)
│   └── roadmap-verticales.md # plan para subvenciones (BDNS), altos cargos (BOE), retribuciones
├── scripts/
│   └── etl_placsp.py         # ETL offline: ATOM/CODICE → contratos_demo.json (one-off, no se despliega)
└── data/
    └── contratos_demo.json   # contratos REALES del organismo demo (con url_expediente) — fuente del filtro
```

**Qué va en `SKILL.md` (breve):**
- Frontmatter: `name: transparencia-es`; `description:` redactada para **disparar** ante consultas
  tipo "contratos públicos, gasto de un ayuntamiento, licitaciones, en qué se gastó el dinero
  público, PLACSP, contratación del sector público en España".
- Misión + **principio de cita obligatoria** y prohibiciones (no periodismo, no inventar).
- Árbol de decisión corto: identificar intención → (contratos) cargar `references/contratos.md` →
  pedir/derivar el órgano y CPV → llamar a `buscar_contratos` → **explicar + enlazar**.
- Puntero a `mapa-fuentes.md`: si preguntan por algo que no son contratos, orientar y decir que esa
  vertical está en roadmap (sin inventar).

El **contenido de `SKILL.md` + `references/`** se pega como **system prompt** en la edge function
`chat` (es lo que conecta las dos mitades del producto).

---

## Proceso de discovery (produce el contenido de la skill y el dataset)

Pasos concretos (los ejecuta la persona "autora de skill" + apoyo de datos):
1. **Mapa de fuentes:** volcar la tabla "qué info → dónde vive" del challenge doc a `mapa-fuentes.md`.
2. **PLACSP a fondo:** en `contrataciondelestado.es` → **Datos Abiertos**. Documentar en
   `contratos.md`: criterios de búsqueda del perfil del contratante (CPV, nº expediente, órgano,
   tipo), ubicación de los ZIP/ATOM mensuales, formato CODICE 2.07, paginación `<link rel="next">` y
   los campos útiles (objeto, importe, adjudicatario, CPV, fechas, estado, **URL del expediente**).
3. **ETL del dataset demo:** descargar un ATOM reciente y, con `etl_placsp.py` (offline, Python ok),
   extraer los contratos del **organismo demo** a `contratos_demo.json` (normalizado, con
   `url_expediente` válidas). Este JSON es la fuente real del chat.
4. **Glosario CPV + tipos de contrato:** `glosario-cpv.md` y `tipos-contrato.md` en lenguaje de calle,
   con 8–12 CPV ciudadanos (obras escuela, limpieza, suministro material…).
5. **Ejemplos verificados:** 2–3 consultas resueltas a mano (incl. caso "colegio") como *few-shot* y
   guion de demo.
6. **Roadmap:** `roadmap-verticales.md` (BDNS API REST, BOE API sumario, retribuciones) — material de
   presentación.

Herramientas: navegador + `WebFetch`/`curl` para datos abiertos; el ETL valida el parseo.

---

## Datos: ETL offline + filtro en la edge function

- **`scripts/etl_placsp.py` (one-off, NO se despliega):** entrada = ATOM/CODICE; salida =
  `contratos_demo.json` como lista de:
  `{ objeto, importe, adjudicatario, cpv, tipo_contrato, fecha, estado, organo, url_expediente }`.
  Solo se ejecuta durante el discovery para fabricar el dataset real. (Cualquier lenguaje; Python por
  comodidad de parseo.)
- **Filtro en producción (edge function, TS/Deno):** `buscar_contratos(organo, cpv?, anio?)` lee
  `contratos_demo.json` desde **Supabase Storage** y filtra por coincidencia de órgano + CPV (+ año).
  Sin parseo CODICE en producción → cero riesgo, offline-safe y rápido.
- *(Stretch)* parsear el ATOM en vivo desde la edge function: solo si sobra tiempo; va a roadmap.

---

## Producto web en Lovable (UI + Cloud + IA)

- **Frontend (Lovable):** pantalla única de chat ciudadano (estética cívica, accesible, móvil-first).
  Cada contrato se renderiza como **tarjeta** (objeto, importe en € formato es-ES, adjudicatario,
  fecha) con botón **"Ver en la fuente oficial"** → `url_expediente`. *Disclaimer* fijo: *"Datos
  oficiales de la Plataforma de Contratación del Sector Público; esta herramienta orienta y muestra
  datos públicos, no sustituye asesoramiento."*
- **Backend (Lovable Cloud · Edge Function `chat`):** system prompt = la skill; **Lovable AI (Gemini
  3 Flash)** con **function calling**; herramienta única `buscar_contratos`. Flujo: detecta intención
  de contratos → si falta órgano/CPV lo pregunta (guía al ciudadano) → llama la herramienta →
  **explica en lenguaje claro y enlaza cada expediente**.
- **Storage/Secrets (Lovable Cloud):** `contratos_demo.json` en Storage; cualquier secret en
  Cloud → Secrets (nunca en cliente).
- *Fallback si el function calling de Gemini Flash falla:* flujo determinista en la edge function
  (extraer órgano/CPV con una llamada simple o parseo → filtrar siempre → el modelo solo redacta la
  explicación).

### Contrato de datos congelado (para construir UI y función en paralelo)
```jsonc
// contratos_demo.json: lista de
{ "objeto": "...", "importe": 123456.0, "adjudicatario": "...", "cpv": "45214210",
  "tipo_contrato": "obras", "fecha": "2025-...", "estado": "Adjudicada",
  "organo": "Ayuntamiento de ...", "url_expediente": "https://contrataciondelestado.es/..." }

// respuesta de la edge function chat
{ "reply": "texto explicado para el ciudadano (markdown)", "contratos": [ /* items como arriba */ ] }
```

**Prompt base para Lovable** (incluye el "problema común" de abajo):
> Construye "Transparencia ES", una web de chat ciudadano. Problema: en España la información pública
> está dispersa y con vocabulario técnico; el ciudadano no sabe dónde buscar contratos públicos ni
> cómo. Esta web es un asistente que responde "¿en qué se gastó mi ayuntamiento?" mostrando contratos
> públicos reales explicados de forma sencilla y enlazando SIEMPRE a la fuente oficial. Usa **Lovable
> Cloud** y **Lovable AI**: crea una **edge function `chat`** que reciba `{mensaje, historial}`, use
> Lovable AI (Gemini, con function calling) con un system prompt que te pasaré (la "skill"), y una
> herramienta `buscar_contratos(organo, cpv?, anio?)` que lea `contratos_demo.json` de Storage y lo
> filtre; devuelve `{reply, contratos[]}`. Frontend: pantalla única de chat, móvil-first, renderiza
> `reply` como markdown y cada contrato como tarjeta (objeto, importe €, adjudicatario, fecha, botón
> "Ver fuente oficial"→url_expediente) + disclaimer. No inventes datos: si `contratos` viene vacío,
> muestra `reply`. Mientras no haya datos reales, usa mock con esa misma forma.

---

## Problema común (texto reutilizable para CUALQUIER prompt de IA del equipo)

> *La información pública en España (contratos, subvenciones, bienes y retribuciones de cargos…) está
> garantizada por la Ley de Transparencia, pero dispersa: el Portal de Transparencia es sobre todo un
> directorio de enlaces a otros portales. CIVIO accede a las fuentes primarias (p.ej. contratos en la
> Plataforma de Contratación del Sector Público), pero hacerlo exige conocimiento tácito y vocabulario
> técnico (códigos CPV, tipos de contrato, expedientes) inaccesible para el ciudadano medio.
> Construimos una skill/asistente que sistematiza ese conocimiento y lleva a cualquier persona a la
> fuente correcta, mostrando datos públicos reales explicados de forma sencilla y enlazando siempre al
> origen oficial. Restricción ética (política de CIVIO): el sistema orienta, extrae y explica datos
> con cita; nunca genera periodismo, opinión, documentos legales ni inventa datos.*

---

## Reparto de tareas (4 personas · timebox ~5h)

- **P1 — Autor de skill / discovery:** `SKILL.md` + `references/*` (contratos, glosario CPV, tipos,
  mapa, roadmap) + ejemplos verificados. Entrega el contenido que será el system prompt.
- **P2 — Datos (ETL):** discovery técnico de PLACSP + `etl_placsp.py` → `contratos_demo.json` real del
  organismo demo (con `url_expediente`). Congela el **contrato de datos**.
- **P3 — Constructor Lovable (Cloud + IA):** edge function `chat` (system prompt = skill, Lovable AI +
  function calling, tool `buscar_contratos` sobre el JSON en Storage) + cableado con el frontend.
- **P4 — UX + integración + CIVIO + demo:** pulido de la UI de chat (tarjetas, enlaces, disclaimer,
  accesibilidad); valida con la persona de CIVIO el **organismo demo** (que tenga datos ricos) y el
  lenguaje; README de entrega; guion de 3 min + roadmap de la presentación.

**Hito de integración** a falta de ~1h: congelar features, integrar y ensayar la demo. P3 y P4
emparejados sobre Lovable.

---

## v1 → v2 (refinamiento) — para la presentación, no para hoy
- Sentarse con CIVIO: validar persona ciudadana, casos reales y wording.
- Añadir verticales por orden de menor fricción técnica: **Subvenciones (BDNS, API REST)** → **Bienes
  de altos cargos (BOE, API sumario)** → **Retribuciones (Portal)**.
- *Stretch* contratos: parseo en vivo del ATOM mensual (datos siempre frescos).
- Detección de cambios (OPP-1b) con changedetection.io sobre fuentes conocidas.
- Publicar la skill como repo open-source instalable (Claude Code / Cursor) + guía de contribución.

---

## Verificación (end-to-end)
1. **Skill aislada (open-source):** instalarla en Claude Code y lanzar *"¿en qué se gastó el
   Ayuntamiento de X en obras?"* → carga `contratos.md`, usa el CPV correcto, devuelve contratos del
   `contratos_demo.json` **+ enlaces oficiales**. Probar consulta fuera de alcance (subvenciones) →
   orienta y cita roadmap, sin inventar.
2. **ETL aislado:** `python scripts/etl_placsp.py` produce `contratos_demo.json` con `url_expediente`
   válidas.
3. **Edge function:** invocar `chat` con la consulta estrella → `{reply, contratos[]}` bien formado;
   verificar que el function calling dispara `buscar_contratos`.
4. **Web e2e (Lovable):** desde la UI, la consulta estrella muestra tarjetas con importe y botón a la
   fuente oficial. Probar sin red externa (datos en Storage) para blindar la demo.
5. **Política:** ninguna respuesta inventa cifras ni emite opinión periodística.

---

## Riesgos y cut-lines
- **Function calling de Gemini Flash poco fiable (riesgo #1):** *fallback* → flujo determinista en la
  edge function (extraer órgano/CPV + filtrar siempre + el modelo solo redacta).
- **Créditos de Lovable AI:** uso de demo es bajo (plan Pro del evento debería bastar); alternativa,
  API key propia de Gemini (free tier de Google) en un secret de Cloud.
- **Parseo CODICE/ATOM:** ya mitigado — se hace **offline una vez**; producción solo filtra JSON.
- **Integración UI↔función:** mitigado por el contrato de datos congelado + mock desde el inicio.
- **Mínimo demoable (si todo se tuerce):** chat con system prompt = skill (guía) + 3–4 contratos
  reales precargados del organismo demo con enlaces. Aun así cumple "datos reales + fuente".

## Estrategia de ramas (decidida)
- **Skill / datos / discovery → directo a `team-turquesa`**, bajo `skills/transparencia-es/`. Es la
  rama a la que haré mis commits.
- **Web → rama aparte** (p.ej. `team-turquesa-web`, conectada a Lovable; código en carpeta `web/` o en
  el repo propio de Lovable). Se mergea a `team-turquesa` al final.
- **Sin conflictos por diseño:** los dos flujos tocan ficheros disjuntos (`skills/` vs `web/`). Para
  evitar el único punto de roce, el **README raíz de entrega lo escribe una sola persona (P4) al
  final**. Nada de PRs hacia el `main` de la organización (lo prohíbe `how-to-work-team-branch.md`).
- **Entrega:** todo pusheado a `team-turquesa` antes de las **19:00 del sábado** (incl. merge de la
  web), con el README de entrega completo.
  