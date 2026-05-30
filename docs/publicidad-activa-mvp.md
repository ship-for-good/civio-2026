# Portal Publicidad Activa — Plan MVP

**Proyecto:** Civio · Ship for Good 2026  
**Fuente de datos:** crawl de [transparencia.gob.es/publicidad-activa](https://transparencia.gob.es/publicidad-activa) · `publicidad-activa-url-map.html`  
**Contexto:** [challenge-discovery.md](../challenge-discovery.md) (Bloque 1 — OPP-1a, OPP-1b)

---

## 1. Problema

El portal nacional de publicidad activa funciona en la práctica como un **directorio de enlaces** hacia muchas fuentes (páginas propias, portales de ministerios, BOE, contratación, subvenciones…). Civio suele **saltarse** el portal y ir a la fuente primaria; ese conocimiento es **tácito** y no está sistematizado.

Para un periodista o ciudadano:

- No hay **inventario** de qué existe antes de buscar (OPP-1a.2).
- La estructura es **inconsistente** entre organismos y materias (OPP-1a.1).
- El vocabulario (slugs, CPV, tipos de contrato…) es opaco (OPP-1a.4).
- Los cambios no se detectan hasta tropezar con ellos (OPP-1b).

**Restricción regulatoria (no es oportunidad):** solo se publica el mínimo legal; la ley no es punitiva. La solución debe construirse **sobre la fragmentación**, no esperar que desaparezca.

**Política de IA de Civio:** permitido indexar, normalizar y enlazar datos públicos; vetada generación de texto periodístico o documentos legales.

---

## 2. Qué dice el crawl (`publicidad-activa-url-map.html`)

| Métrica | Valor |
|--------|--------|
| URLs únicas | **1.249** |
| Páginas crawladas | 1.167 |
| Profundidad máxima | 7 |
| URLs en profundidad 7 | 884 (~71 %) |

Casi todo está bajo:

`https://transparencia.gob.es/publicidad-activa/por-materias/{materia}/…`

### 2.1 Seis materias (buckets legales)

| Materia (slug) | URLs | % aprox. |
|----------------|------|----------|
| `organizacion-empleo` | 1.117 | **89 %** |
| `informacion-economico-presupuestaria` | 42 | 3 % |
| `altos-cargos` | 31 | 2 % |
| `tramites` | 25 | 2 % |
| `normativa-otras-disposiciones` | 19 | 2 % |
| `planificacion-estadistica` | 12 | 1 % |

### 2.2 Tres ejes ocultos en las URLs

El sitio mezcla dimensiones que el usuario piensa por separado:

1. **Tema** — materia → subtema (RPT, estructura, retribuciones…).
2. **Organismo** — slugs `rpt-mdef`, `estructura-mdef`, `normativa-pg` (~30+ códigos, algunos históricos).
3. **Tiempo** — `historico` → `rpt-enero-2026`, `xiv-legislatura`, `ejercicio-2018`, `seguimiento20200723`…

El portal oficial obliga a recorrer **tema → histórico → organismo**. Civio suele pensar **organismo + tema + «última versión»**.

### 2.3 Mapa materia → subtema (navegación humana)

#### Organización y empleo (`organizacion-empleo`)

| Subtema | ~URLs | Etiqueta UI |
|---------|-------|-------------|
| `relaciones-puestos-trabajo` | 738 | Relaciones de puestos de trabajo (RPT) |
| `estructura` | 172 | Estructura orgánica |
| `funciones` | 120 | Funciones |
| `normativa` | 51 | Normativa de organización |
| `registro-actividades-tratamiento` | 30 | RAT |
| `compatibilidad-empleados` | 3 | Compatibilidades |
| `codigo-conducta` | 1 | Código de conducta |
| `sector-publico-institucional` | 1 | Sector público institucional |

#### Información económico-presupuestaria

- `presupuestos-generales-estado` (PGE gastos/ingresos por año)
- `cuentas-anuales-auditoria` (ejercicios 2013–2022)
- `bienes-inmuebles`, `ejecucion`, `estabilidad`, `informes-fiscalizacion`, `rendicion-cuentas`

#### Altos cargos

- `retribuciones` — **alojado en el portal** (caso Civio)
- `declaraciones-bienes-derechos` — suele **enlazar al BOE**
- `actividad-privada-cese`, `indemnizaciones-abandono` (muchas páginas `seguimiento*` fechadas)
- `curriculos`, `agendaAACC`, `principios`, `obligaciones-age`, etc.

#### Trámites

- `contratos`, `subvenciones`, `acuerdos-marco`, `convenios-encomiendas`, `encargos-medios-propios`, `subvenciones-partidos-politicos` — a menudo **portales sectoriales externos**

#### Normativa y otras disposiciones / Planificación y estadística

- Planes anuales, participación pública, cartas de servicios, planes/programas

---

## 3. Modelo de datos propuesto

Cada URL del crawl = un **recurso** indexable (no un nodo de árbol):

```ts
type Resource = {
  id: string;                    // hash URL canónica
  url: string;
  materia: string;
  materiaLabel: string;
  subtema: string;
  subtemaLabel: string;
  tipo?: "rpt" | "estructura" | "funciones" | "normativa" | "rat" | ...;
  organismoCode?: string;        // ej. mdef
  organismoLabel?: string;
  vigencia: "vigente" | "historico";
  periodo?: string;              // rpt-enero-2026, xiv-legislatura-1, ...
  pathSegments: string[];
  depth: number;
  // Fase 2
  title?: string;
  hosting: "portal-nacional" | "enlace-externo" | "desconocido";
  fuentePrimaria?: string;       // URL BOE, contratación, portal ministerio
  civioTip?: string;
};
```

**Pipeline MVP:** extraer JSON embebido en `publicidad-activa-url-map.html` → script que aplana el árbol → `dashboard/data/publicidad-activa-index.json` + `organismos.json` + `fuentes-civio.json`.

---

## 4. Alcance MVP

### 4.1 Dentro del MVP (hackathon)

| # | Funcionalidad | Oportunidad |
|---|---------------|-------------|
| 1 | Home «¿Qué hay en Publicidad activa?» + estadísticas | OPP-1a.2 |
| 2 | **Búsqueda global** (texto, organismo, materia, subtema) | OPP-1a.1, 1a.4 |
| 3 | Navegación **materia → subtema** con contadores | OPP-1a.1 |
| 4 | Filtros: organismo, vigente/histórico, tipo (RPT/estructura/…) | OPP-1a.3 |
| 5 | Listado con etiquetas legibles + «Abrir en transparencia.gob.es» | OPP-1a.3 |
| 6 | Atajo **«Última versión»** (RPT/estructura más reciente por organismo) | Uso periodístico frecuente |
| 7 | **Vista técnica** (árbol del HTML actual) para power users | Reutilizar crawl UI |
| 8 | Campo **`hosting`** + **tips Civio** (tabla manual, ver §6) | OPP-1a.3, tabla discovery |
| 9 | Enlace **«Portal de transparencia del organismo»** (catálogo curado) | Ver §7 |

### 4.2 Fuera del MVP (explícito en demo)

- Espejar contenido (PDFs, HTML de ministerios).
- Crawl de todos los portales autonómicos/locales.
- Búsqueda en Portal de Contratación (CPV, expedientes).
- Derecho de acceso / certificado digital (Bloque 2 — OPP-2).
- Alertas de cambios (OPP-1b) — mejor herramienta externa (§5.3).

### 4.3 Nice-to-have si hay tiempo

- Export CSV de resultados filtrados.
- Glosario mínimo (CPV, RPT, publicidad activa).
- Badge «nuevo en crawl» si se repite el crawl.
- Enlaces a informes del Consejo de Transparencia (presión / completitud).

---

## 5. Mejoras fáciles alineadas con `challenge-discovery.md`

### 5.1 OPP-1a — Implementables en días (prioridad MVP)

| Sub-OPP | Mejora concreta en el dashboard | Esfuerzo |
|---------|----------------------------------|----------|
| **1a.2** Inventario | Pantalla inicial: «1.249 recursos indexados en 6 materias» + desglose | Bajo |
| **1a.1** Estructura | Misma taxonomía para todos los recursos (materia/subtema/tipo) aunque el origen sea distinto | Bajo |
| **1a.3** Conocimiento tácito | Archivo `fuentes-civio.json`: por subtema, «fuente primaria recomendada» + tip | Bajo–medio |
| **1a.4** Vocabulario | Sinónimos en búsqueda («defensa»→`mdef`); glosario en tooltips; nunca solo slug | Bajo |

**Tabla «dónde está realmente»** (discovery §Bloque 1) — mostrar en ficha de recurso:

| Tipo | Ejemplo | Etiqueta UI |
|------|---------|-------------|
| En portal nacional | Retribuciones altos cargos | En transparencia.gob.es |
| Enlace externo | Declaraciones de bienes → BOE | Fuente primaria: BOE |
| Portal sectorial | Contratos, subvenciones | Portal sectorial (enlace) |

### 5.2 OPP-1b — Mejora rápida sin construir motor propio

| Sub-OPP | Mejora | Esfuerzo |
|---------|--------|----------|
| **1b.1** | Botón «Vigilar esta URL» → enlace preconfigurado a [changedetection.io](https://github.com/dgtlmoon/changedetection.io) o similar | Muy bajo |
| **1b.2** | Documentar en README cómo re-ejecutar el crawl y diff de URLs nuevas | Bajo |
| **1b.3** | «Guardar búsqueda» en `localStorage` (filtros + query), sin backend | Bajo |

Discovery recomienda **no reinventar** monitorización: integrar herramienta madura.

### 5.3 Alineación misión Civio

- **No** presentar el MVP como «nuevo portal de transparencia del Estado».
- **Sí** como «capa de inventario, búsqueda y curación sobre lo que ya publica la administración».
- Sistematizar tips que hoy viven en personas (rotación de equipo, ciudadanía).

### 5.4 Qué NO mezclar en este MVP (prioridad discovery)

- **OPP-2** (derecho de acceso): otro producto; requiere certificado, PDFs caducados, Airtable…
- Resolver CPV/contratación en profundidad: otro módulo o enlace al portal de contratación con guía.

---

## 6. Archivo `fuentes-civio.json` (ejemplo)

Conocimiento tácito del discovery, versionable:

```json
{
  "subtemas": {
    "altos-cargos/retribuciones": {
      "hosting": "portal-nacional",
      "civioTip": "Uno de los pocos bloques publicados directamente en el portal nacional."
    },
    "altos-cargos/declaraciones-bienes-derechos": {
      "hosting": "enlace-externo",
      "fuentePrimaria": "https://www.boe.es/",
      "civioTip": "El portal solo enlaza; la fuente real es el BOE."
    },
    "tramites/contratos": {
      "hosting": "enlace-externo",
      "fuentePrimaria": "https://contrataciondelestado.es/",
      "civioTip": "Civio suele ir directo al Portal de Contratación del Sector Público."
    },
    "tramites/subvenciones": {
      "hosting": "enlace-externo",
      "fuentePrimaria": "https://sede.administracion.gob.es/",
      "civioTip": "Plataforma de Subvenciones / sede según convocatoria."
    }
  }
}
```

Enriquecer en el hackathon con 10–15 entradas que el equipo conozca; no hace falta cubrir las 1.249 URLs.

---

## 7. ¿Se pueden unificar los portales de cada ministerio/organismo?

### 7.1 Respuesta corta

| Nivel de «unificación» | ¿Factible en MVP? | Qué es |
|------------------------|-------------------|--------|
| **A. Índice + búsqueda** del portal **nacional** publicidad activa | Sí | Lo que ya permite el crawl (1.249 URLs) |
| **B. Catálogo «por organismo»** (todas las materias de un ministerio en un sitio) | Sí | Reorganizar el índice por `organismoCode` |
| **C. Enlaces al portal de transparencia de cada ministerio** | Parcial | JSON curado ~25–35 organismos |
| **D. Unificar contenido** de portales ministeriales + autonómicos + sectoriales | No en hackathon | Miles de sitios, formatos distintos, sin API común |

### 7.2 Tres capas del ecosistema (importante para la demo)

```
┌─────────────────────────────────────────────────────────────┐
│  Capa 1: transparencia.gob.es/publicidad-activa (AGE)      │
│  → Directorio nacional; muchas páginas por ministerio         │
│    (rpt-mdef, estructura-mdef…) pero NO todo el contenido   │
└──────────────────────────┬──────────────────────────────────┘
                           │ enlaces
┌──────────────────────────▼──────────────────────────────────┐
│  Capa 2: Portal de transparencia de cada ministerio/OOAA    │
│  → Misma obligación legal, otra URL, otra estructura          │
└──────────────────────────┬──────────────────────────────────┘
                           │ enlaces
┌──────────────────────────▼──────────────────────────────────┐
│  Capa 3: Fuentes primarias (BOE, contratación, subvenciones)│
└─────────────────────────────────────────────────────────────┘
```

El crawl **solo cubre la Capa 1**. Unificar «todos los portales» implicaría crawlear Capa 2 (decenas de ministerios + cientos de organismos) y enlazar Capa 3 — proyecto de meses, mantenimiento continuo.

Discovery es explícito: *«cualquier solución tiene que construirse sobre la fragmentación existente»*.

### 7.3 Qué SÍ puede hacer el MVP como «unificación»

1. **Vista por organismo**  
   Agrupar recursos con `organismoCode` (Defensa, Sanidad, Presidencia del Gobierno…) con pestañas: RPT | Estructura | Funciones | Normativa | RAT.

2. **Ficha de organismo**  
   - Lista de recursos en publicidad activa (Capa 1).  
   - Botón: «Portal de transparencia del ministerio» → URL en `organismos.json`.  
   - Tips: «Para contratos, ir a contratacióndelestado.es».

3. **Doble entrada**  
   - Explorar por **tema** (materia/subtema).  
   - Explorar por **organismo** (como piensa un periodista).

4. **No duplicar, enlazar**  
   El MVP es un **hub de descubrimiento**, no un repositorio. Cada tarjeta abre la URL oficial.

### 7.4 Cómo construir `organismos.json` (MVP)

```json
{
  "mdef": {
    "label": "Ministerio de Defensa",
    "portalTransparencia": "https://www.defensa.gob.es/transparencia/",
    "notas": "Comprobar URL en sede del ministerio"
  },
  "pg": {
    "label": "Presidencia del Gobierno",
    "portalTransparencia": "https://www.lamoncloa.gob.es/transparencia/"
  }
}
```

Fuentes para rellenar en el hackathon:

- Slugs únicos del crawl (`rpt-*`, `estructura-*`, `normativa-*`).
- Páginas «mas-info-rpt» del propio portal nacional.
- Preguntar en Slack `#ask-civio` URLs que el equipo ya use.

**No hace falta** crawlear cada portal ministerial para la demo: 20 organismos bien documentados valen más que 200 enlaces rotos.

### 7.5 Unificación autonómica / local (OPP-2.4)

Fuera de alcance del MVP centrado en AGE. Posible **roadmap**: misma arquitectura de índice si Civio aporta listas de portales CCAA o datasets del Consejo de Transparencia.

### 7.6 Mensaje para jurado / Civio

> «No unificamos los datos en un solo sitio; unificamos **cómo se descubren**: un inventario buscable, una vista por organismo y enlaces a la fuente primaria que Civio ya conoce.»

---

## 8. Arquitectura de la app (`dashboard/`)

```
/                          → resumen + estadísticas
/explorar                  → búsqueda + facetas (landing periodistas)
/explorar/[materia]
/explorar/[materia]/[subtema]
/organismos                → listado AGE
/organismos/[code]          → recursos + enlace portal ministerio
/mapa-urls                 → árbol técnico (HTML actual)
```

**Stack:** Next.js (ya iniciado), JSON estático, sin backend obligatorio.

---

## 9. UX

1. Etiquetas humanas siempre junto al slug (`rpt-mdef` → «Defensa · RPT»).
2. Por defecto **solo vigente**; histórico bajo toggle (707 URLs RPT histórico).
3. Búsqueda con sinónimos (ministerio, organismo, tema).
4. Empty states que enseñan («Prueba materia Altos cargos o organismo Sanidad»).
5. UI en **español** (portal fuente en ES).

---

## 10. Fases de implementación

| Fase | Entregable | Horas orientativas |
|------|------------|-------------------|
| 0 | Extraer JSON + aplanar + `organismos.json` + labels | 2–4 |
| 1 | `/explorar` búsqueda + facetas + enlaces oficiales | 4–6 |
| 2 | Vista por organismo + vigente/histórico + `fuentes-civio.json` | 2–4 |
| 3 | Portar mapa URL + pulido demo | 2 |
| Post | Crawl ministerios, títulos HTML, changedetection | — |

---

## 11. Guión de demo (3 min)

1. Problema: 7 clics y conocer `historico/rpt-enero-2026/rpt-mdef`.
2. Solución: buscar «Defensa RPT» → 1 clic → fuente oficial.
3. Inventario: 1.249 páginas, 6 materias (OPP-1a.2).
4. Organismo: ficha Defensa + enlace al portal del ministerio (unificación tipo B+C).
5. Honestidad: declaraciones → tip «ir al BOE»; contratos → contratación (no fingir centralización total).

---

## 12. Decisiones abiertas

- [ ] Persona principal: periodista Civio vs ciudadano (profundidad del glosario).
- [ ] Idioma UI: español (recomendado).
- [ ] Quién cura `organismos.json` y `fuentes-civio.json` en el hackathon.
- [ ] Si el alcance incluye solo AGE o también 2–3 CCAA piloto (solo si Civio da URLs).

---

## 13. Referencias

- Crawl interactivo: `publicidad-activa-url-map.html`
- Discovery: `challenge-discovery.md`
- App: `dashboard/` (Next.js)
- Política IA Civio: https://civio.es/nosotros/uso-IA
