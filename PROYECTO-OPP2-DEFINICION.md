# Civio Inbox — Definición del proyecto (OPP-2)

> Definición técnica de cabo a rabo del proyecto para el reto **OPP-2 (seguimiento del derecho de acceso)**.
> Equipo: Roger, Jaume, Boris, Álvaro, Diego. Deadline: **sábado 30 mayo, 19:00**.

---

## 1. Qué es (en una frase)

Una aplicación web que **centraliza el seguimiento de las solicitudes de derecho de acceso**: arrastras el PDF de una notificación, la app lo **interpreta automáticamente** (tipo de respuesta + fechas), **calcula todos los plazos legales solo**, te avisa de lo que vence, y **detecta cuando una solicitud se ha multiplicado** en varios expedientes. Es el "upgrade" de la Airtable que Civio ya usa.

**El usuario:** un periodista de Civio que gestiona decenas de solicitudes en paralelo y hoy lo hace a mano con una tabla + emails opacos.

---

## 2. Alcance

### ✅ Dentro
- Importar el modelo de datos real de Civio (CSV de su Airtable) como semilla.
- **Drag & drop de un PDF** de notificación → extracción + clasificación con IA.
- **Motor de plazos** automático (silencio negativo, prórroga Art 20.1, ventana de reclamación al CTBG).
- **Dashboard** de estado de todos los expedientes + **digest diario**.
- **Detección de redistribución** (1 solicitud → N subexpedientes).

### ❌ Fuera (explícito)
- **Autenticación con certificado digital / Cl@ve PIN.** No tenemos certificado y es justo lo que cerró `tuderechoasaber.es`. El PDF lo aporta el usuario manualmente (ya lo ha descargado del portal).
- **Envío automático de solicitudes** al portal.
- **Lectura/scraping del Portal de Transparencia** (además acaba de cambiar — nuevo portal mayo 2026).
- Generación de texto periodístico o legal (vetado por la política de IA de Civio).

---

## 3. Hallazgos que fundamentan el diseño (de `#ask-civio`)

1. **Modelo de datos real disponible:** `Solicitudes_anonimizado.csv` en `origin/main` (haz `git pull`). Columnas exactas en §5.
2. **PideInfo es open source** (`github.com/Naroh091/PideInfo`, `pideinfo.es`): plataforma que gestiona solicitudes, plazos y reclamaciones. **Referencia obligada** — mirad su modelo de datos y su UX antes de codificar. Civio sugirió investigar cómo manejan el certificado.
3. **El Portal de Transparencia cambió** (nuevo portal, mayo 2026): no asumir formatos antiguos; por eso el PDF es input manual, no scraping.
4. **Civio gestiona AGE + autonómico + local** (el CSV tiene Madrid, Cataluña, Galicia, ayuntamientos…). El modelo debe soportar varios ámbitos.

---

## 4. Arquitectura

```
┌──────────────────────────────────────────────────────────────┐
│  AWS EC2  ·  docker compose                                    │
│                                                                │
│   ┌────────────────────────┐      ┌────────────────────────┐  │
│   │  Phoenix app (Elixir)   │      │   PostgreSQL            │  │
│   │  - LiveView (UI)        │◄────►│   - solicitudes         │  │
│   │  - Ecto (datos)         │      │   - notificaciones      │  │
│   │  - Oban (jobs/cron)     │      │   - (uploads en disco)  │  │
│   │  - Req → LLM API        │      └────────────────────────┘  │
│   └───────────┬─────────────┘                                  │
│               │ HTTPS                                          │
└───────────────┼────────────────────────────────────────────────┘
                ▼
        LLM API (clasificación + extracción del PDF)
```

**Stack:**
- **Phoenix 1.7 + LiveView** — UI y backend en una sola base de código Elixir. Tiempo real nativo para el dashboard y los avisos.
- **Ecto + PostgreSQL** — persistencia.
- **Oban** — jobs en background (procesar el PDF sin bloquear la UI) y **cron** del digest diario.
- **Req** (cliente HTTP) — llamadas a la **API de un LLM** (proveedor a decidir).
- **Subida de ficheros:** `Phoenix.LiveView` `allow_upload` (drag & drop nativo).
- **Deploy:** `mix release` dentro de Docker, orquestado con `docker compose` (servicios `app` + `db`) en una EC2. Secrets por variables de entorno.

---

## 5. Modelo de datos (PostgreSQL)

Derivado 1:1 del CSV real de Civio. Lo "computado" se calcula en el motor de plazos (§7), no se guarda crudo.

### Tabla `solicitudes`
| Columna | Tipo | Origen CSV / nota |
|---------|------|-------------------|
| `id` | uuid PK | — |
| `external_id` | string | `Id` (ej. `00001-00087725`, `2024/2503283`) |
| `ambito` | string | `Ámbito` (AGE, Madrid, Cataluña, Ayuntamiento de X…) |
| `fecha_solicitud` | date | `Fecha` |
| `estado` | string | `Estado` (en_plazo, reclamada, contencioso, resuelta, ganado_sin_info…) |
| `asunto` | text | `Asunto` |
| `organismo` | string | `Ministerio` (puede venir vacío) |
| `inicio_tramitacion` | date | `Inicio tramitación` (arranca el reloj) |
| `prorroga_20_1` | date null | `Art 20.1 (volumen)` (si hay prórroga) |
| `resolucion` | date null | `Resolución` |
| `notificacion` | date null | `Notificación` |
| `notas` | text | `Notas` (¡contiene refs a expedientes relacionados! → §8) |
| `autor` | string | `Autor` (David, Ángela, Ter, Eva…) |
| `reclamacion_ref` | string null | `Reclamación` (referencia del CTBG) |
| `parent_id` | uuid null | FK a `solicitudes.id` — para redistribución |
| `inserted_at`/`updated_at` | timestamps | — |

> `Vencimiento normal`, `Vencimiento 20.1`, `Vencimiento`, `Días para…` del CSV son **campos calculados** → los produce el motor de plazos en runtime (§7), no se almacenan.

### Tabla `notificaciones`
| Columna | Tipo | Nota |
|---------|------|------|
| `id` | uuid PK | — |
| `solicitud_id` | uuid FK | a qué expediente pertenece |
| `tipo` | string | `inicio_tramitacion` \| `prorroga` \| `resolucion_parcial` \| `resolucion_completa` \| `afirmativa` \| `negativa` \| `apertura_alegaciones` |
| `fecha_notificacion` | date | — |
| `fecha_inicio_tramitacion` | date null | la que extrae la IA del PDF |
| `pdf_path` | string | fichero subido |
| `raw_text` | text | texto extraído del PDF |
| `llm_confidence` | float | confianza de la clasificación (para revisión humana) |
| `inserted_at` | timestamp | — |

---

## 6. El pipeline del PDF (el núcleo)

```
1. Usuario arrastra el PDF en la LiveView (allow_upload).
2. Se guarda en disco y se encola un job Oban (no bloquea la UI).
3. El job manda el PDF a la API del LLM pidiendo SALIDA ESTRUCTURADA (JSON):
   { tipo, organismo, expediente_id, fecha_notificacion,
     fecha_inicio_tramitacion, expediente_padre?, confianza }
4. Se valida el JSON y se crea/actualiza la solicitud + notificación.
5. El motor de plazos recalcula fechas. La LiveView se actualiza en vivo (PubSub).
6. Si la confianza es baja → se marca para revisión humana (no se inventa nada).
```

**Enfoque de IA — LLM multimodal vía API:**
- Los LLM multimodales modernos **aceptan PDFs de forma nativa** vía API (texto + **comprensión visual** de PDFs escaneados) → no necesitamos OCR ni `pdftotext` para el MVP.
- Clasificación + extracción con **salida estructurada** (function calling / JSON schema) para que no alucine campos.
- Modelo sugerido: un LLM multimodal **rápido y barato** para clasificar; escalar a uno más potente solo si algún PDF se resiste.
- **Optimización opcional (si sobra tiempo):** para PDFs nativos, extraer texto con `pdftotext` (poppler, vía port de Elixir) y mandar solo texto → menos tokens, más rápido. Para escaneados, mandar el PDF entero al LLM (visión).
- **Cacheo de prompt** (si el proveedor lo soporta) del bloque de instrucciones + ejemplos few-shot (los PDFs sintéticos/reales) para abaratar las llamadas repetidas.
- Aislar la integración tras un módulo `LLMClient` con interfaz genérica → cambiar de proveedor sin tocar el resto del sistema.

> ⚠️ Sin PDFs reales de Civio todavía, pero **hay fuentes públicas** (las resoluciones se publican anonimizadas). Estrategia: descargar un puñado de PDFs reales de las fuentes de abajo → ver el formato/estructura real → **generar sintéticos calcados de ese formato** (para tener volumen y todos los tipos) → usar los reales para **validar** el clasificador al final. En paralelo, pedir a Civio sus PDFs (mensaje en §12) por si su formato concreto difiere.

### Fuentes públicas de PDFs reales (para basar los sintéticos)
- **Resoluciones del CTBG** (miles, anonimizadas): https://consejodetransparencia.es/content/ctbg/es/reclamaciones/nuestras-resoluciones.html
- **Resoluciones denegatorias del Portal de Transparencia** (BD con ministerio/asunto/fecha/causa + PDF): https://transparencia.gob.es/en/derecho-acceso/resoluciones-denegatorias
- **Ejemplo concreto de resolución** (PDF nativo, "RESOLUCIÓN DE LA SOLICITUD DE INFORMACIÓN nº…"): https://www.mintur.gob.es/es-es/servicios/transparencia/Documents/1-066376%20Resolucion.pdf
- **Dataset CTBG reclamaciones/resoluciones 2023** (datos.gob.es): https://datos.gob.es/es/catalogo/a04003003-reclamaciones-y-resoluciones-del-consejo-de-transparencia-y-buen-gobierno-ctbg-2023
- **Otras CCAA** publican respuestas a solicitudes (ej. CARM Murcia): https://transparencia.carm.es/respuestas-solicitudes-derecho-de-acceso

> Ojo: estas son sobre todo **resoluciones** (estimatoria/denegatoria/parcial) y **reclamaciones del CTBG**. Los avisos de **inicio de tramitación** y **prórroga** son notificaciones internas que casi no se publican → esos tipos casi seguro habrá que **sintetizarlos** (o pedírselos a Civio).

---

## 7. Motor de plazos (reglas exactas)

Basado en la Ley 19/2013 + el cómputo que ya hace el CSV de Civio.

```
vencimiento_normal = inicio_tramitacion + 1 mes
si prorroga_20_1 presente:
    vencimiento_efectivo = inicio_tramitacion + 2 meses   (prórroga art. 20.1)
si no:
    vencimiento_efectivo = vencimiento_normal

# SILENCIO NEGATIVO (art. 20.4): si pasa el plazo sin resolución → se entiende DENEGADO
si hoy > vencimiento_efectivo y resolucion == null:
    estado = "a_reclamar_silencio"
    fecha_limite_reclamacion_ctbg = vencimiento_efectivo + 1 mes

si resolucion presente y respuesta incompleta:
    estado = "a_reclamar_incompleta"
    fecha_limite_reclamacion_ctbg = notificacion + 1 mes

si reclamacion ganada y sin info recibida:
    estado = "ganado_sin_info"
    dias_incumplimiento = hoy - fecha_resolucion_favorable   # contador

dias_para_reclamar = fecha_limite_reclamacion_ctbg - hoy
```

> Punto crítico para Jaume: el silencio es **negativo**, no positivo. Verificar cómputo mes a mes (fecha a fecha) con el art. 20.4 delante. Tests unitarios con las filas reales del CSV (las fechas de `Vencimiento` ya están calculadas allí → casos de prueba gratis).

---

## 8. Detección de redistribución (feature distintiva)

El caso real: 1 solicitud → 22 expedientes (uno por ministerio). Heurística para detectarlo **sin** depender de que el PDF lo diga:

1. **Parsear el campo `Notas`** del CSV: ya contiene referencias explícitas tipo *"Relacionada directamente con el expediente 001-063916"* → construir relación `parent_id`.
2. **Agrupar por similitud:** mismo `autor` + `asunto` parecido (fuzzy) + creados en una ventana corta de tiempo + mismo `reclamacion_ref` raíz.
3. En la UI: cuando un grupo supera N subexpedientes, mostrar un aviso **"1 solicitud → N expedientes"** con la vista agrupada y los plazos de cada hijo.

> MVP: empezar por (1), que es determinista y usa datos reales. (2) como mejora.

---

## 9. Funcionalidades por prioridad (para no jugárselo a todo o nada)

| Prioridad | Funcionalidad | Dueño |
|-----------|---------------|-------|
| **MUST** (core garantizado) | Importar CSV real → BD; motor de plazos; dashboard con estados y vencimientos | Álvaro + Jaume + Roger |
| **MUST** | Drag PDF → clasificación + extracción (LLM) → crea/actualiza expediente | Álvaro |
| **SHOULD** | Digest diario (Oban cron) replicando el email de Civio; avisos de plazo en zona roja | Boris |
| **SHOULD** | Vista de detalle de expediente con cuenta atrás de plazos (semáforo) | Roger |
| **COULD** | Detección de redistribución (parseo de Notas → agrupación) | Jaume + Álvaro |
| **COULD** | Notificaciones push/Telegram; mirar integración estilo PideInfo | Boris |
| **WON'T** (este hackathon) | Certificado/Cl@ve, envío automático, scraping del portal | — |

**Regla de oro:** el sábado a las 13:00 el bloque MUST debe estar funcionando end-to-end (aunque feo). SHOULD/COULD se añaden encima. Feature freeze a las 18:00.

---

## 10. Reparto del equipo (ajustado a LiveView)

| Persona | Rol | Foco en este proyecto |
|---------|-----|------------------------|
| **Álvaro** | Tech lead — backend + IA | Pipeline LLM (clasificación/extracción), esquema Ecto, **define el contrato de datos** la 1ª hora. Ancla técnica. |
| **Roger** | Frontend — LiveView | Toda la UI: dashboard, detalle de expediente con plazos, vista de redistribución, drag&drop. (Flutter senior → la curva de LiveView es corta; pairing inicial con Álvaro.) |
| **Jaume** | Backend — motor de plazos | Lógica de plazos (determinista, testeable) + import del CSV + tests con filas reales. Mentoría de Álvaro. |
| **Boris** | DevOps — infra + automatización | `docker compose` en EC2, deploy, Oban cron del digest diario, avisos. Setup de entornos el viernes. |
| **Diego** | PO — demo + fiabilidad | Disciplina de alcance, datos de demo curados, guion de 3 min, entorno de demo fiable (terreno SRE), enlace con `#ask-civio`. |

> Contrato de datos en la 1ª hora (el JSON de §6 + el esquema de §5). Con eso, los 4 trabajan en paralelo contra mocks.

---

## 11. Cronograma (orden de build)

| Cuándo | Objetivo | Quién |
|--------|----------|-------|
| Vie 18–21h | Decidir todo (✅ hecho), `git pull` del CSV, mirar PideInfo, montar entornos, generar PDFs sintéticos, pedir PDFs reales a Civio | Todos |
| Vie noche | Boris: esqueleto Phoenix + Postgres en docker compose + deploy vacío en EC2. Descargar lo pesado. | Boris |
| Sáb 10–13h | **MUST**: import CSV → motor de plazos → dashboard; drag PDF → LLM → expediente. Vertical slice end-to-end. | Álvaro+Jaume+Roger |
| Sáb 13–16h | **SHOULD**: digest diario + avisos + detalle con semáforo. **COULD**: redistribución. | Boris+Roger+Jaume |
| Sáb 16–18h | Validar prompt con PDFs reales si llegaron; robustez; README; deploy final. **Freeze 18:00.** | Todos+Diego |
| Sáb 18–19h | Ensayo demo ×2; push a la branch antes de 19:00. | Diego+Álvaro |

---

## 12. Acciones pendientes / preguntas a Civio

**Pedir PDFs reales** — pega esto en `#ask-civio`:

```
Hola de nuevo 👋 Vamos con OPP-2: una app donde arrastras el PDF de una notificación
del portal y la interpreta sola (tipo de respuesta + fechas + plazos). El certificado
queda fuera de scope: el PDF lo aporta la persona, que ya lo ha descargado.

Para entrenar/probar la interpretación nos vendría genial:
1) ¿2-3 PDFs reales ANONIMIZADOS de notificaciones, de tipos distintos (inicio de
   tramitación, prórroga, resolución parcial/completa, denegación)?
2) ¿El PDF es texto seleccionable o escaneado (imagen)?
3) ¿Qué frase/encabezado/código permite distinguir el tipo de notificación?
4) ¿Dónde aparece la fecha de "inicio de tramitación" dentro del documento?
5) Redistribución (1 solicitud → N expedientes): ¿el PDF referencia de algún modo
   el expediente "padre", o llegan como expedientes independientes?

¡Gracias! Mientras tanto arrancamos con ejemplos sintéticos.
```

**Decisión técnica pendiente:** elegir proveedor/modelo de LLM (uno multimodal que acepte PDF) y si añadimos `pdftotext` como pre-paso (optimización, no bloqueante).

---

## 13. Demo de 3 minutos

1. **(30s)** El dolor: "Cada notificación es un email opaco; hay que entrar con certificado, descargar el PDF y abrirlo para saber qué es — por decenas de expedientes a la vez."
2. **(2 min)** El flujo: arrastrar un PDF → la app dice "Resolución parcial, Ministerio X" y **calcula los plazos solos** → dashboard con lo que vence → **aviso de redistribución** "1 solicitud → 22 expedientes" → digest diario.
3. **(30s)** Impacto: "Sustituye su Airtable manual, elimina el trabajo de detective y no se les escapa un plazo." Open source (MIT), reutilizable por Civio.

Datos pre-cargados, nada en vivo dependiente de red, plan B grabado (Diego).

---

## 14. Cumplimiento de la política de IA de Civio

✅ Permitido: la IA solo **clasifica y extrae datos** de documentos propios y automatiza gestión interna.
❌ No hacemos: generar texto periodístico/legal, IA como fuente, comunicación con terceros, scraping del portal.
