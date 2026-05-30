# Team Rojo — Buscador de información pública

Proyecto desarrollado en la **1ª edición de Ship For Good** (29–30 de mayo de 2026, [42 Barcelona](https://www.42barcelona.com/es/)).

**Buscador** (`/es/buscador`) — prototipo funcional que orienta a la ciudadanía hacia el portal público correcto según lo que quieren consultar o solicitar.

Lo que hemos construido estos días es gracias a todas las personas que han participado en la hackathon — no solo quienes crean, sino también quienes han hecho posible que el evento suceda. Gracias a todas ellas.

---

## 1. Problema que intentamos resolver y por qué lo elegimos

### El problema

En España, la información pública no vive en un solo sitio. Depende del tipo de dato, puede estar en el [Portal de Transparencia](https://transparencia.gob.es), en la [Plataforma de Contratación (PLACE)](https://contrataciondelestado.es), en la [Base de Datos Nacional de Subvenciones (BDNS)](https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias), en el [BOE](https://boe.es), en la sede electrónica de un ministerio concreto... Si la información no está publicada, el ciudadano puede ejercer su **derecho de acceso** (Ley 19/2013), pero debe presentar la solicitud ante el organismo competente — y cada uno tiene su propio formulario.

El resultado es una experiencia confusa: periodistas, activistas y personas sin formación jurídica pierden tiempo navegando portales genéricos, acaban en la fuente equivocada o abandonan antes de llegar al formulario de solicitud.

### Por qué lo elegimos

- **Alineación con Civio:** trabaja precisamente contra la opacidad institucional. El reto es suyo; el impacto potencial es real y medible.
- **Problema concreto y acotado:** no es un chatbot genérico, sino un enrutador hacia fuentes oficiales verificables.
- **User stories claras:** desde el periodista que quiere solicitar contratos al Ministerio de Hacienda hasta la persona que pregunta «¿cuánto cobra un ministro?» y necesita ir a retribuciones, no al BOE.
- **Viabilidad en hackathon:** tenemos datos de referencia (mapeo de entidades del Estado, keywords, URLs validadas contra el portal en vivo) y un flujo demostrable en la demo.

---

## 2. Cómo nuestra solución trata de resolver el problema

El **buscador** recibe una pregunta en lenguaje natural y devuelve:

1. **Qué tipo de información** busca el usuario (contratos, subvenciones, sueldos de altos cargos, derecho de acceso…).
2. **A qué portal** debe ir (con enlace directo cuando es posible).
3. **Qué pasos seguir** en ese portal, en lenguaje claro.
4. **Enlace a la sede del ministerio** cuando se trata de una solicitud de acceso a un organismo concreto.

### Flujo técnico

```
Consulta del ciudadano
        ↓
Clasificación (agente Cursor o fallback por keywords)
        ↓
topicId → explicación, pasos y deep link (grafo de conocimiento)
        ↓
Detección de entidad (ministerio) si aplica → URL de portada en sede.gob.es
        ↓
Tarjeta de resultado con CTA «Ir al portal»
```

### Componentes clave

| Pieza | Ubicación | Función |
|-------|-----------|---------|
| Grafo de keywords | `docs/keywords.json` | Mapea consultas a temas del dominio público (retribuciones, contratación, derecho de acceso…) |
| Textos y pasos | `src/domain/buscador/topics.ts` | Explicaciones y guías por tema |
| Clasificador LLM | `src/lib/cursor/resolve-topic.ts` | Agente Cursor que elige el `topicId` según el grafo |
| Fallback determinista | `src/domain/buscador/classify.ts` | Coincidencia por keywords si no hay API key |
| Entidades | `src/domain/buscador/entities.ts` | Resuelve organismo → URL de portada pública en la sede electrónica |
| API | `src/app/api/buscador/classify/route.ts` | Orquesta clasificación + construcción del resultado |
| UI | `src/components/buscador/` | Input, chips de ejemplo, tarjeta de resultado |

La URL de destino para solicitudes de acceso apunta a la **portada pública** del procedimiento en la sede electrónica, no al formulario autenticado: desde ahí el usuario elige Cl@ve, certificado o DNI-e y accede al trámite oficial.

---

## 3. En qué punto está la solución

**Estado actual: prototipo funcional (v1), demostrable en local.**

### Lo que funciona

- Interfaz del buscador con consultas libres y chips de ejemplo.
- Clasificación por agente Cursor (requiere `CURSOR_API_KEY` y `pnpm dev`) con fallback por keywords.
- Varios temas del ámbito público cubiertos (retribuciones, contratación, subvenciones, BOE, derecho de acceso…).
- Detección heurística de organismos por nombre para enrutar solicitudes de acceso.
- Mapeo de entidades de la Administración General del Estado con URLs de portada verificadas.
- Deep links a PLACE y BDNS cuando el tema lo permite.
- Tests unitarios (Vitest) y E2E (Playwright) para el flujo de derecho de acceso / Hacienda.

### Limitaciones conocidas

- El buscador **solo funciona con servidor** (`pnpm dev`); la API no se despliega en el build estático de GitHub Pages.
- La clasificación con agente tarda unos segundos y depende de cuenta Cursor Pro.
- Cobertura de keywords limitada: consultas fuera del grafo devuelven `unknown`.
- Si el usuario no menciona un ministerio en una solicitud de acceso, no siempre se genera deep link (falta selector de organismo en UI).
- Textos del buscador solo en español (decisión MVP).
- No hay autenticación ni envío automático de formularios: el usuario completa el trámite manualmente en la sede electrónica.

---

## 4. Cómo continuar: de prototipo a producto funcional

### Próximos pasos

- **Integración del certificado digital** en el flujo, para que el usuario pueda autenticarse desde el buscador y saltar el paso manual de identificación (Cl@ve, certificado o DNI-e) en la sede electrónica.
- **Optimizar la IA** para distinguir cuándo la información ya está publicada y devolverla directamente — en lugar de enrutar siempre hacia una solicitud de acceso cuando el dato ya es consultable en un portal abierto.

### Corto plazo (MVP usable)

1. **Desplegar la API** en un entorno con Node.js (Vercel, Railway, etc.), no solo la landing estática.
2. **Selector de ministerio** cuando la consulta es `derecho_acceso` pero no se detecta entidad.
3. **Ampliar keywords y casos de prueba** a partir de consultas reales de usuarios de Civio / PideInfo.
4. **Internacionalización** del buscador si el producto debe servir a más público.
5. **Métricas básicas** de uso y de acierto en el enrutamiento.

### Medio plazo (producto robusto)

6. **Clasificador de entidad dedicado** (LLM o reglas), no solo detección por nombre.
7. **Cobertura autonómica y local:** hoy el foco es Administración General del Estado; ampliar a CCAA y ayuntamientos implica nuevos grafos y fuentes.
8. **Integración con [PideInfo](https://pideinfo.es/)** u otras herramientas de Civio para no duplicar flujos ya resueltos.
9. **Feedback en UI:** «¿Te ha servido?» / «No es esto» para mejorar el grafo iterativamente.
10. **Observabilidad:** logs, alertas si el portal de destino cambia de URL, tests de humo contra sede.gob.es.

### Largo plazo (visión)

11. **Asistencia en el trámite** (v2+): pre-rellenado del formulario, seguimiento del expediente — requiere manejo de certificados/Cl@ve y acuerdos legales.
12. **API pública** para que otros medios o ONGs integren el enrutador.
13. **Mantenimiento editorial** del grafo de conocimiento cuando cambien portales o procedimientos (transparencia es un dominio que muta).

---

## Detalles técnicos

| | |
|---|---|
| **Stack** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, next-intl, Motion |
| **Clasificación** | Cursor SDK (`@cursor/sdk`) + fallback determinista |
| **Tests** | Vitest, Testing Library, Playwright |
| **Gestor de paquetes** | pnpm |

### Arranque local

```bash
cd team-rojo
pnpm install
cp env.example .env.local   # opcional: CURSOR_API_KEY para clasificación con agente
pnpm dev
```

- Buscador: [http://localhost:3000/es/buscador](http://localhost:3000/es/buscador)

Ver [docs/DEMO.md](./docs/DEMO.md) para el guion de demo y prueba con `curl`.

### Scripts útiles

```bash
pnpm dev          # servidor de desarrollo
pnpm build        # build de producción
pnpm test         # tests unitarios
pnpm test:e2e     # tests E2E (Playwright)
pnpm lint         # ESLint
pnpm cursor:ping  # verificar API key de Cursor
```

### Documentación adicional

| Documento | Contenido |
|-----------|-----------|
| [docs/DEMO.md](./docs/DEMO.md) | Demo local y guion de inputs |
| [docs/KEYWORDS.md](./docs/KEYWORDS.md) | Cómo ampliar el grafo de keywords |
| [docs/entity-mapping.md](./docs/entity-mapping.md) | Mapeo de ministerios → `idAmb` |
| [docs/userStories.md](./docs/userStories.md) | User stories de referencia |
| [docs/testing-e2e.md](./docs/testing-e2e.md) | Escenarios E2E |

---

## Colaboradores

### Reto y organización

- **[Fundación Civio](https://civio.es/)** — Organización con la que trabajamos en esta edición. Fundación independiente que combate la opacidad institucional y usa periodismo, tecnología y datos abiertos para dar a la ciudadanía acceso a la información. El reto del buscador es suyo.
- **[42 Barcelona](https://www.42barcelona.com/es/)** — Sede del evento.
- **[Software Crafters Barcelona](https://softwarecrafters.barcelona/)** — Comunidad que impulsa la hackathon y cuida la artesanía del código, las buenas prácticas y el crecimiento profesional en el sector tech.

### Patrocinadores

- **[Manfred](https://www.getmanfred.com/)** — Empresa de recruiting tecnológico que apuesta por procesos de selección más transparentes, humanos y honestos. Cuidan la comunidad tech con recursos como brújulas salariales, comparativas de salarios, contenido sobre carreras tecnológicas y herramientas para tomar mejores decisiones profesionales.
- **[QualityClouds](https://qualityclouds.ai/)** — Ayudan a las empresas a mejorar la calidad, estabilidad y seguridad de sus plataformas SaaS: visibilidad sobre problemas y vulnerabilidades, priorización de mejoras y automatización de controles de calidad en todo el ciclo de desarrollo. Patrocinan Ship For Good porque la IA facilita construir rápido, pero hace falta código que funcione durante años, no solo el sábado por la noche.
- **[Plain Concepts](https://www.plainconcepts.com/)** — Consultora tecnológica global especializada en IA, datos, cloud e ingeniería de software. Transforman tecnología de vanguardia en impacto real de negocio, ayudando a las organizaciones a innovar, escalar y acelerar su transformación digital.
- **[Next Digital](https://www.nextdigital.es/)** — Startup que acompaña a empresas en su transformación digital, con foco en innovación, diseño y personas. Creen que la tecnología puede cambiar el mundo y apoyan esta hackathon para demostrarlo.

---

## Equipo

Proyecto del **Team Rojo** en Ship For Good 2026 · think · build · help
