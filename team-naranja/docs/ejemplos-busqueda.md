# Ejemplos de búsqueda · Cómo probar la aplicación

Guía para explorar el repositorio y probar el asistente de transparencia con preguntas reales. Cada ejemplo está mapeado al catálogo en [`src/data/catalog.json`](../src/data/catalog.json).

---

## Cómo ejecutar la app

La aplicación funcional con datos mock está en la carpeta [`lovable/`](../../lovable/):

```bash
cd lovable
npm install
npm run dev
```

Abre http://localhost:5173 en el navegador.

También puedes desplegarla en [Lovable](https://lovable.dev) conectando el repo (rama `team-naranja`, carpeta `lovable/`). Ver [`lovable/README.md`](../../lovable/README.md).

> **Modo actual:** la app responde con matching local sobre `catalog.json`. No requiere Supabase ni API keys.

---

## Cómo interpretar las respuestas

El asistente clasifica cada pregunta según el campo `availability` del tema que mejor coincide:

| `availability` en catálogo | Estado UI | Color | Qué significa |
|---|---|---|---|
| `hosted` | `found` | Verde | La información está publicada en el portal de transparencia |
| `linked` | `linked` | Ámbar | El portal solo enlaza a otra fuente (BOE, BDNS, datos.gob.es…) |
| `external_portal` | `external` | Ámbar | Hay que consultar un portal sectorial aparte |
| `not_published` | `not_found` | Rojo | No está en publicidad activa → wizard de solicitud de acceso |

---

## 5 ejemplos para probar

Usa estas preguntas en el chat. Puedes escribirlas a mano o pulsar las sugerencias que aparecen al abrir la app (las tres primeras coinciden con los ejemplos 1, 5 y 4).

---

### 1. Verde · Retribuciones de altos cargos

**Pregunta:**

> ¿Cuánto cobran los ministros?

**Topic del catálogo:** `retribuciones-altos-cargos`  
**Categoría:** Altos cargos  
**Disponibilidad:** `hosted` → estado **verde**

**Qué deberías ver:**

- Card con borde verde y etiqueta *"Información encontrada"*
- Secciones: *Datos disponibles*, *Qué puedes hacer con esto*, *Limitaciones*
- Botón para abrir la fuente oficial

**Enlace esperado:**  
https://transparencia.gob.es/publicidad-activa/por-materias/altos-cargos/retribuciones

**Por qué funciona:** la pregunta activa keywords como `ministros`, `cobran`, `retribuciones` o `sueldo`.

---

### 2. Verde · Presupuestos y ejecución presupuestaria

**Pregunta:**

> ¿Cuánto gasta el Estado en sanidad?

**Topic del catálogo:** `presupuestos-ejecucion`  
**Categoría:** Información económico-presupuestaria  
**Disponibilidad:** `hosted` → estado **verde**

**Qué deberías ver:**

- Card verde con información sobre ejecución presupuestaria
- Descripción de formatos (web, tabla)
- Enlace directo al portal de transparencia

**Enlace esperado:**  
https://transparencia.gob.es/publicidad-activa/por-materias/informacion-economico-presupuestaria/ejecucion

**Por qué funciona:** keywords como `gasto público`, `presupuesto`, `cuánto gastan` o `dinero público`.

**Nota:** si la pregunta es muy genérica, prueba variantes como *"¿Cuánto gasta el Gobierno?"* o *"ejecución presupuestaria del Estado"*.

---

### 3. Ámbar (enlace) · Subvenciones y ayudas públicas

**Pregunta:**

> ¿Qué ayudas públicas ha concedido el Gobierno?

**Topic del catálogo:** `subvenciones-bdns`  
**Categoría:** Contratos, convenios y subvenciones  
**Disponibilidad:** `linked` → estado **ámbar**

**Qué deberías ver:**

- Card con borde ámbar y aviso: *"El portal de transparencia solo enlaza a otra fuente"*
- Explicación de que los datos están en el Sistema Nacional de Subvenciones
- Botón hacia la Base de Datos Nacional de Subvenciones (BDNS)

**Enlace esperado:**  
https://www.pap.hacienda.gob.es/bdnstrans/GE/es/inicio

**Por qué funciona:** keywords `ayudas`, `subvenciones`, `convocatoria`, `becas`.

**Contexto:** el portal de transparencia no aloja los datos de subvenciones; solo redirige al sistema de Hacienda.

---

### 4. Ámbar (portal externo) · Contratos de obras

**Pregunta:**

> Quiero ver los contratos de las obras de un colegio en Barcelona

**Topic del catálogo:** `contratos-publicos-plataforma`  
**Categoría:** Contratos, convenios y subvenciones  
**Disponibilidad:** `external_portal` → estado **ámbar**

**Qué deberías ver:**

- Card ámbar con etiqueta *"Portal sectorial"*
- Explicación de que los expedientes completos están fuera del portal de transparencia
- Bloque de *Vocabulario útil*: CPV, expediente, administración licitadora
- Botón al Portal de Contratación del Sector Público

**Enlace esperado:**  
https://contrataciondelestado.es/wps/portal/plataforma

**Por qué funciona:** keywords `contratos`, `obra`, `colegio`, `licitación`, `CPV`.

**Contexto del challenge Civio:** caso típico del vecino que descubre por casualidad que las obras de un colegio están licitadas en un portal que no conocía.

> **Nota:** existe también `contratos-publicos-resumen` (`hosted`, verde) con un resumen en transparencia. Preguntas con *obra* y *colegio* deberían priorizar el portal externo por score de keywords.

---

### 5. Rojo · Personal eventual y asesores ministeriales

**Pregunta:**

> ¿Quiénes son los asesores de los ministerios?

**Topic del catálogo:** `personal-eventual-asesores`  
**Categoría:** Altos cargos  
**Disponibilidad:** `not_published` → estado **rojo**

**Qué deberías ver:**

- Card roja con etiqueta *"Información no publicada"*
- Wizard en **3 pasos:**
  1. Confirmar qué información necesitas
  2. Organismo competente + enlace a la Sede Electrónica
  3. Plantilla de solicitud con botón **"Copiar texto"**
- Texto basado en el Art. 13 de la Ley 19/2013

**Portal de solicitud:**  
https://transparencia.sede.gob.es/

**Por qué funciona:** keywords `asesores`, `asesor`, `personal eventual`, `gabinete`, `ministerios`.

**Contexto del challenge Civio:** investigación documentada por Civio sobre asesores en ministerios — requiere solicitud de acceso y, a menudo, reclamación al Consejo de Transparencia.

> Este es el **único tema** con `not_published` en el catálogo actual.

---

## Tabla resumen

| # | Pregunta | Color | Caso de uso |
|---|---|---|---|
| 1 | ¿Cuánto cobran los ministros? | Verde | Datos publicados en el portal |
| 2 | ¿Cuánto gasta el Estado en sanidad? | Verde | Presupuestos / ejecución |
| 3 | ¿Qué ayudas públicas ha concedido el Gobierno? | Ámbar | Portal solo enlaza (subvenciones) |
| 4 | Contratos de obras de un colegio en Barcelona | Ámbar | Portal sectorial (contratación) |
| 5 | ¿Quiénes son los asesores de los ministerios? | Rojo | Solicitud de acceso |

---

## Preguntas extra (opcional)

| Pregunta | Color esperado | Topic |
|---|---|---|
| ¿Dónde están los organigramas del Gobierno? | Verde | `organigramas-estructura` |
| ¿Cómo pido información que no está publicada? | Ámbar | `solicitud-acceso-informacion` |
| ¿Dónde descargar datos abiertos del Gobierno? | Ámbar | `datos-abiertos-gobierno` |
| ¿Cómo reclamo si me deniegan una solicitud? | Ámbar | `consejo-transparencia` |

---

## Checklist de prueba rápida

Antes de la demo o de hacer push, verifica:

- [ ] La app arranca con `npm run dev` en `lovable/`
- [ ] Ejemplo 1 → card verde + enlace a retribuciones
- [ ] Ejemplo 4 → card ámbar + enlace a contrataciondelestado.es
- [ ] Ejemplo 5 → wizard 3 pasos + copiar plantilla funciona
- [ ] Las sugerencias clicables bajo el input responden sin escribir

---

## Referencias

- Catálogo de datos: [`src/data/catalog.json`](../src/data/catalog.json)
- Tests automatizables: [`demo-questions.md`](../demo-questions.md)
- App runnable: [`lovable/README.md`](../../lovable/README.md)
- Plan del equipo: [`plan-mvp-equipo.md`](../plan-mvp-equipo.md)
