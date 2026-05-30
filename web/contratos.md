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
