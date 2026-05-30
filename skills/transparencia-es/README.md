# Skill `transparencia-es` — Navegador de información pública (Contratación)

Skill (formato Claude Agent Skill) que sistematiza el conocimiento tácito de Civio para encontrar
**contratación pública** en España: lleva a cualquier persona a la fuente primaria correcta
(Plataforma de Contratación del Sector Público, PLACSP), traduce la jerga (CPV, tipos de contrato)
y devuelve **datos reales explicados de forma sencilla, citando siempre la fuente oficial**.

Forma parte del proyecto del equipo **turquesa** para Civio (Hackathon Ship for Good 2026). Es la
"v1" centrada en **Contratos**; otras materias (subvenciones, BOE, retribuciones) están mapeadas en
`references/mapa-fuentes.md` y planificadas en `references/roadmap-verticales.md`.

## Doble uso

1. **Como skill en un agente** (Claude Code / Cursor): copia la carpeta `transparencia-es/` a tu
   directorio de skills y pregunta en lenguaje natural (ver ejemplos). El agente carga `SKILL.md`,
   consulta las referencias y usa los scripts.
2. **Como cerebro del chatbot web**: el contenido de `SKILL.md` + `references/` es el *system prompt*
   de la edge function `chat` (Lovable Cloud + Lovable AI), y `scripts/buscar_contratos.ts` es la
   implementación de referencia de la herramienta de datos.

## Estructura

```
transparencia-es/
├── SKILL.md                 # disparador + reglas de oro + flujo
├── references/              # conocimiento cargado bajo demanda
│   ├── contratos.md         # PLACSP a fondo (búsqueda, datos abiertos, ejemplos)
│   ├── glosario-cpv.md      # qué es el CPV + tabla de CPV ciudadanos
│   ├── tipos-contrato.md    # obra/servicio/suministro/menor/concesión
│   ├── mapa-fuentes.md      # qué materia vive en qué portal
│   └── roadmap-verticales.md
├── scripts/
│   ├── etl_placsp.py        # ETL: datos abiertos PLACSP -> JSON normalizado
│   ├── buscar_contratos.py  # consulta local del dataset (la "herramienta")
│   └── buscar_contratos.ts  # referencia de la tool para la edge function de Lovable
└── data/
    └── contratos_demo.json  # MUESTRA con estructura real (regenerable con el ETL)
```

## Uso rápido (local)

Requisitos: Python 3.8+ (solo librería estándar; sin dependencias).

```bash
# Consultar la muestra: obras de colegios del Ayuntamiento de Barcelona
python scripts/buscar_contratos.py --organo "Barcelona" --cpv 4521

# Regenerar el dataset con datos REALES (requiere red hacia PLACSP)
python scripts/etl_placsp.py --periodo 202504 --organo "Barcelona" --cpv 4521 \
    --out data/contratos_demo.json
```

Alternativa a instalar Python, Docker:

```
docker run -it --rm -v $PWD:/usr/src/app python bash
```

## Ejemplos de preguntas que resuelve

- *"¿Cuánto se ha gastado el Ayuntamiento de Barcelona en obras de colegios?"*
- *"¿Qué empresa ganó la limpieza de los colegios y por cuánto?"*
- *"¿Dónde encuentro los contratos de mi ayuntamiento?"* (orienta a PLACSP y explica cómo buscar)

## Principios (política de IA de Civio)

Orienta, extrae, normaliza y explica datos públicos **citando siempre la fuente**. **No** inventa
datos ni genera texto periodístico, opiniones, recursos o documentos legales.

> Nota: la muestra `contratos_demo.json` lleva nombres de empresa genéricos e importes de ejemplo a
> propósito. Para la demo con datos reales, regenérala con `etl_placsp.py` desde el feed oficial.
