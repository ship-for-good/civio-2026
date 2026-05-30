# Transparencia ES

**Encuentra en qué se gasta el dinero público, explicado en lenguaje normal y con la fuente oficial al lado.**

🔗 **Demo:** [transparencia-es (Lovable)](https://transparencia-es.lovable.app)

Proyecto del equipo **turquesa** en el hackathon [Ship for Good 2026](https://www.shipforgood.org/es),
con [Civio](https://civio.es/) como organización aliada.

---

## El problema

En España tienes derecho a saber en qué se gasta el dinero público: la Ley de Transparencia obliga a
publicar contratos, subvenciones, sueldos y bienes de los cargos públicos. El problema no es que falte
información, es que está repartida en una docena de portales distintos y casi nadie sabe encontrarla.
El propio Portal de Transparencia funciona, en buena parte, como un directorio de enlaces que te manda
a otros sitios.

Los datos de verdad viven en las fuentes primarias. Los contratos, por ejemplo, están en la
**Plataforma de Contratación del Sector Público (PLACSP)**. Pero para sacar algo en claro tienes que
conocer un vocabulario que solo manejan quienes trabajan con esto a diario: códigos CPV, tipos de
contrato, números de expediente... Es el conocimiento que los periodistas de Civio tienen en la
cabeza, y que un ciudadano normal no tiene por qué saber.

> Caso real recogido por Civio: un vecino seguía las obras del colegio de su barrio. Los contratos
> estaban publicados —siete documentos con fases, importes y plazos— pero nunca los habría encontrado
> sin saber que existía el portal de contratación.

## Qué hace Transparencia ES

Le preguntas en lenguaje normal —_"¿cuánto se ha gastado mi ayuntamiento en colegios?"_— y el
asistente traduce esa pregunta al lenguaje de los portales oficiales (deduce el órgano y el código
CPV), busca los contratos reales y te los explica de forma sencilla: qué es, cuánto costó, quién lo
ganó y cuándo. Cada dato viene con el **enlace al expediente oficial**, para que puedas comprobarlo.

Hay una regla que no se salta nunca, y viene de la propia política de uso de IA de Civio: el sistema
orienta, extrae y explica datos públicos **citando siempre la fuente**. No opina, no escribe noticias
ni documentos legales, y no se inventa cifras. Si un dato no está en la fuente oficial, lo dice.

## Las dos piezas

El proyecto son dos cosas que comparten el mismo cerebro:

- **La web** (carpeta del proyecto en Lovable) — la cara visible. Un chat pensado para cualquier
  persona, con los contratos en tarjetas y un botón para ir a la fuente oficial. Para la demo del
  hackathon usa un conjunto de datos curado, así que responde especialmente bien a los casos que
  hemos preparado.

- **La skill `transparencia-es`** (`skills/transparencia-es/`) — el motor. Es una _skill_ en formato
  estándar (Claude Agent Skill) que puedes añadir a tu propio agente de IA. Detrás tiene scripts que
  extraen los datos directamente del portal oficial, así que no está limitada a unos pocos ejemplos:
  consulta cualquier órgano, cualquier CPV y cualquier periodo. La misma skill es la que alimenta el
  _system prompt_ del chat de la web. La ejecución desde la nube puede ser rechazada por los portales
  de transparencia, para evitar esto se debe ejecutar desde local, por ejemplo Claude Code desde el
  terminal.

Esta versión cubre **contratación pública** a fondo. Las demás materias (subvenciones, bienes de
cargos, retribuciones) están mapeadas y planificadas, pero todavía no implementadas.

## Instalar y usar la skill

La skill es Python puro y solo usa la librería estándar, así que no hay nada que instalar aparte de
**Python 3.8 o superior**.

### Opción A — añadirla a tu agente (Claude Code, Cursor…)

Copia la carpeta `skills/transparencia-es/` a tu directorio de skills y pregunta en lenguaje natural.
El agente carga `SKILL.md`, consulta las referencias y llama a los scripts cuando hace falta.

### Opción B — empaquetar el `.zip` (p. ej. para subirla a Claude)

El paquete tiene que llevar `SKILL.md` **en la raíz del zip** (no dentro de una carpeta
`transparencia-es/`). Por eso se comprime el _contenido_ de la carpeta, desde dentro:

```bash
cd skills/transparencia-es
zip -r ../../transparencia-es.zip . -x "*/__pycache__/*" "*.pyc" "data/*"
```

Eso genera `transparencia-es.zip` en la raíz del repo, listo para subir.

### Probarla por la línea de comandos

```bash
cd skills/transparencia-es

# Obras de colegios del Ayuntamiento de Barcelona (sobre el dataset de muestra)
python scripts/buscar_contratos.py --organo "Barcelona" --cpv 4521

# Regenerar el dataset con datos REALES desde el portal oficial (necesita conexión)
python scripts/etl_placsp.py --periodo 202504 --organo "Barcelona" --cpv 4521 \
    --out data/202504_barcelona_4521.json
```

## Cómo está montado

```
[ Web de chat (Lovable) ]
        │
        ▼
[ Edge function "chat" (Lovable Cloud / Supabase) ]
   · system prompt = el contenido de la skill
   · Lovable AI (Gemini) con function calling
   · herramienta: buscar_contratos(organo, cpv?, anio?)
        │
        ▼
[ Datos normalizados de PLACSP en JSON ]
   · los genera el ETL (scripts/etl_placsp.py) a partir
     del open data oficial (ATOM / CODICE, ZIP mensual)
```

El trabajo pesado —descargar y parsear el open data de PLACSP— se hace una vez, fuera de la
conversación, y deja un JSON limpio. La consulta del usuario solo filtra ese JSON, así que es rápida y
no depende de que el portal esté disponible en ese momento. PLACSP no ofrece una API en tiempo real:
publica ficheros mensuales, y por eso trabajamos sobre una copia con su fecha a la vista.

### Tecnologías

- **Skill / ETL:** Python (solo librería estándar) y formato Claude Agent Skill (Markdown).
- **Web:** Lovable — frontend, Lovable Cloud (Supabase: Storage y Edge Functions en TypeScript/Deno)
  y Lovable AI (Gemini con _function calling_).
- **Fuente de datos:** open data de la Plataforma de Contratación del Sector Público (ATOM / CODICE 2.07).

### Variables de entorno

La skill no necesita ninguna. La web se despliega sobre Lovable, que gestiona el backend y el acceso
a la IA sin claves propias.

## Roadmap

Lo siguiente, más o menos por orden de menor esfuerzo:

- **Más fuentes.** Subvenciones (BDNS, que ya tiene API REST pública), bienes de altos cargos (BOE) y
  retribuciones. El diseño es replicable: una referencia y un script por cada materia.
- **Datos reales y al día en la web.** Un proceso mensual que refresque el dataset desde PLACSP en
  lugar del conjunto curado de la demo.
- **Más cobertura de contratos.** Incluir los contratos menores e integrar las plataformas
  autonómicas que vuelcan a PLACSP.
- **Curación del conjunto de datos.** Modificar los scripts para mejorar y reducir la cantidad de datos
  evitando así la duplicidad por los cambios de estados en los contratos.

El detalle está en
[`skills/transparencia-es/references/roadmap-verticales.md`](./skills/transparencia-es/references/roadmap-verticales.md).

## Equipo turquesa

- Mercedes Egido
- Javier Rubio
- Fran A.R. Vivas
- Sergi Luque

## Licencia

Publicado bajo licencia **MIT** (ver [`LICENSE`](./LICENSE)). Esto garantiza, entre otras cosas, que
Civio pueda usar, desplegar y adaptar el proyecto siempre que quiera. Más contexto en
[`AUTHORSHIP.md`](./AUTHORSHIP.md).
