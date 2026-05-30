# Contratación pública en España — Plataforma de Contratación del Sector Público (PLACSP)

## Por qué aquí (y no en el Portal de Transparencia)

Cuando alguien quiere saber "en qué se gastó el dinero" un ayuntamiento, un ministerio o
cualquier administración, la información **no** suele estar en el Portal de Transparencia: este
es en gran parte un directorio de enlaces. Los contratos públicos se publican en la
**Plataforma de Contratación del Sector Público (PLACSP)**, donde cada organismo tiene su
**perfil del contratante**.

- Web de búsqueda: <https://contrataciondelestado.es> → sección **"Licitaciones"**.
- Es donde están licitaciones, adjudicaciones, importes, adjudicatarios, pliegos y plazos.
- Barrera real: para buscar bien hay que conocer vocabulario técnico (CPV, tipo de contrato,
  nº de expediente, nombre exacto del órgano). Esta skill existe para traducir eso.

## Cómo se busca en PLACSP (criterios)

La búsqueda del perfil del contratante admite, entre otros:

- **Órgano de contratación** — quién licita (ej. "Ayuntamiento de Barcelona"). Es el filtro
  más intuitivo para un ciudadano. Ojo: el nombre debe coincidir con el oficial.
- **CPV** — *Common Procurement Vocabulary*, la clasificación europea del objeto del contrato
  (obras de colegio, limpieza, suministro de material…). Ver `glosario-cpv.md`.
- **Tipo de contrato** — obras / servicios / suministros / etc. Ver `tipos-contrato.md`.
- **Número de expediente** — identificador interno del organismo (si ya lo conoces).
- **Estado** — en plazo, evaluación, adjudicada, resuelta, anulada…
- **Importe** y **fechas** de publicación.

Sin al menos el **órgano** y/o el **CPV**, los resultados son inmanejables. El trabajo de la
skill es deducir esos dos datos de una pregunta en lenguaje natural y, si faltan, preguntarlos.

## Datos abiertos de PLACSP (la fuente para datos reales)

PLACSP publica datos abiertos por **sindicación ATOM** comprimida en ZIP mensual.

- **Licitaciones (excluye contratos menores)** — fichero mensual:
  ```
  https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3_AAAAMM.zip
  ```
  (AAAA = año, MM = mes con dos dígitos). El ZIP se lee empezando por
  `licitacionesPerfilesContratanteCompleto3.atom`.
- **Contratos menores** — se publican en un conjunto aparte (sindicación de "contratos menores
  perfiles contratantes", mismo esquema mensual).
- **Formato:** cada `.atom` contiene un máximo de **500 entradas** y se encadena con
  `<link rel="next" href="...">` hasta agotar el periodo. El contenido de cada entrada sigue el
  estándar **CODICE 2.07** (esquema del Ministerio de Hacienda, basado en UBL).
- **Catálogo:** dataset en datos.gob.es `e05188501` ("Licitaciones publicadas en los perfiles
  del contratante… excluyendo contratos menores").
- **Herramienta oficial de apoyo:** *OpenPLACSP* (convierte el open data a hoja de cálculo).

> Importante: **no hay API REST de consulta en tiempo real**. Para "datos en vivo" se descarga
> el ZIP/ATOM y se procesa. Por eso esta skill **parsea una vez** (ETL offline) a un JSON limpio
> y luego **filtra** ese JSON — rápido, determinista y sin depender de la red en la demo.

### Campos CODICE útiles (mapeo a nuestro JSON normalizado)

Dentro de cada `<entry>` ATOM, el bloque CODICE expone (nombres simplificados):

| Nuestro campo     | Origen CODICE (aprox.)                                              |
|-------------------|--------------------------------------------------------------------|
| `objeto`          | `cac:ProcurementProject/cbc:Name`                                  |
| `importe`         | `cac:ProcurementProject/cac:BudgetAmount/cbc:TotalAmount`          |
| `cpv`             | `cac:ProcurementProject/cac:RequiredCommodityClassification/cbc:ItemClassificationCode` |
| `tipo_contrato`   | `cac:ProcurementProject/cbc:TypeCode`                              |
| `organo`          | `cac:LocatedContractingParty/cac:Party/cac:PartyName/cbc:Name`     |
| `adjudicatario`   | `cac:TenderResult/cac:WinningParty/cac:PartyName/cbc:Name`         |
| `estado`          | `cbc:ContractFolderStatusCode`                                     |
| `expediente`      | `cbc:ContractFolderID`                                             |
| `url_expediente`  | `<link>` / `<id>` de la entrada (deeplink al detalle en PLACSP)    |
| `fecha`           | `atom:updated` de la entrada                                       |

(El mapeo exacto puede variar según versión de CODICE; `scripts/etl_placsp.py` es tolerante a
ausencias y namespaces.)

## Datos reales vs demo — cómo cachear los reales (llave en mano)

El repo incluye `data/contratos_demo.json` marcado como **demo** (`_meta.es_demo = true`): tiene la
estructura real de PLACSP pero importes y empresas son de ejemplo. Sirve para construir la web sin
red. Para los casos que se enseñan en la UX conviene **datos reales cacheados**.

**Importante:** la descarga del feed oficial **no funciona desde un sandbox con la red restringida**
(el host `contrataciondelsectorpublico.gob.es` suele estar fuera de la allowlist). Ejecuta el ETL en
una **máquina con internet** (tu portátil), commitea el JSON resultante y súbelo.

```bash
cd skills/transparencia-es

# (A) Un mes, filtrando órgano + obras educativas (CPV 4521*)
python scripts/etl_placsp.py --periodo 202504 --organo "Barcelona" --cpv 4521 \
    --out data/contratos_demo.json

# (B) Varios meses encadenados (más probabilidad de pillar obras de colegios, que son poco
#     frecuentes en un solo mes). El ETL deduplica por expediente.
python scripts/etl_placsp.py --periodo 202409,202410,202411,202412,202501 \
    --organo "Barcelona" --cpv 4521 --out data/contratos_demo.json

# (C) Si ya descargaste el ZIP a mano (red bloqueada en CI, etc.)
python scripts/etl_placsp.py --source ./licitacionesPerfilesContratanteCompleto3_202504.zip \
    --organo "Barcelona" --cpv 4521 --out data/contratos_demo.json
```

Al regenerar con el ETL, el `_meta` pasa a `es_demo: false` y `aviso_ui: null` **con el mismo nombre
de fichero**: la web detecta que son reales y **oculta el banner de demo automáticamente** (no hay que
tocar el frontend). Verifica luego que un par de `url_expediente` abren el expediente correcto.

**Consejos para que el caso estrella tenga datos ricos:**
- Las obras de colegios (`45214210`) son esporádicas; usa el **prefijo `4521`** (todo edificio
  educativo) o **varios meses** (opción B). Si aun así sale poco, sube a `45` (toda obra) y filtra
  luego, o elige un órgano con más volumen mensual.
- Los importes pueden ser de **licitación o adjudicación**; dilo en la explicación cuando lo sepas.
- Fuente de respaldo si PLACSP no cuadra para Barcelona: **Open Data BCN**
  (`opendata-ajuntament.barcelona.cat`, sección *Contractació*, adjudicaciones de los últimos 5 años,
  descargable) y la **PSCP** de la Generalitat (`contractaciopublica.gencat.cat`). Son oficiales;
  normalízalas al mismo esquema y deja `url_expediente` apuntando a su portal.

## Cómo ayudar al ciudadano (patrón de respuesta)

1. **Reformula** la pregunta a `organo` + `cpv` (+ `anio`). Explica brevemente qué CPV usas y
   por qué ("colegio nuevo" → obras de construcción de centros educativos, CPV 45214210).
2. **Llama a `buscar_contratos`** con esos parámetros.
3. **Resume cada contrato** así: *objeto · importe · adjudicatario · fecha · estado*, y enlaza
   `url_expediente`. Suma el total si tiene sentido ("en 2024 se adjudicaron N contratos de
   obras por un total de X €").
4. **Cierra** diciendo cómo verlo en el portal oficial y ofreciendo afinar (otro año, otro tipo).

## Ejemplo verificado (guion de demo): "las obras del colegio de mi barrio en Barcelona"

> Contexto real (caso recogido por Civio): un vecino que seguía las obras de un colegio en
> Barcelona descubrió que los contratos estaban publicados —siete PDFs con fases, adjudicaciones
> y plazos— pero nunca los habría encontrado sin saber que existía el portal de contratación.

Flujo esperado de la skill:
- Usuario: *"¿Cuánto se ha gastado el Ayuntamiento de Barcelona en obras de colegios?"*
- Skill: deduce `organo = "Ayuntamiento de Barcelona"`, `cpv = "45214210"` (obras de centros
  educativos; ver glosario), explica la elección, llama a `buscar_contratos` y devuelve los
  contratos reales con importes, adjudicatarios y **enlaces al expediente oficial**, más el total.
- Si el usuario no dice el tipo de obra, la skill pregunta o amplía a CPV `4521*` (edificios).

## Limitaciones honestas (decláralas si vienen al caso)

- El open data de PLACSP **excluye los contratos menores** en el fichero principal (van aparte).
- La cobertura depende de que cada organismo publique en PLACSP; algunas CCAA agregan desde sus
  propias plataformas.
- Los importes pueden ser de licitación o de adjudicación; indícalo cuando lo sepas.
