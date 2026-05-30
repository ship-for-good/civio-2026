# Roadmap — extender la skill a otras verticales

La v1 cubre **Contratación (PLACSP)** en profundidad. El diseño es replicable: por cada vertical
se añade un `references/<materia>.md` + (si hay fuente automatizable) una herramienta `buscar_*`.
Orden recomendado por **menor fricción técnica**:

## 1) Subvenciones — BDNS (la más fácil: tiene API REST)

- Fuente: **Base de Datos Nacional de Subvenciones** (infosubvenciones.es / pap.hacienda.gob.es).
- **API REST pública, sin autenticación** (~29 endpoints): convocatorias, concesiones, beneficiarios,
  órganos, con paginación. Existe la librería `bdns-fetch` (Python) como referencia.
- Herramienta propuesta: `buscar_subvenciones(beneficiario?, organo?, anio?)` → lista de concesiones
  con importe, beneficiario, convocatoria y enlace.
- Caso ciudadano: *"¿Qué ayudas ha recibido esta empresa/entidad?"*.
- Ventaja: al ser API REST, **sí permite datos en vivo** sin ETL previo.

## 2) Bienes / declaraciones de altos cargos — BOE

- Fuente: **BOE** (el Portal de Transparencia solo enlaza). API de datos abiertos:
  `https://www.boe.es/datosabiertos/api/api.php` (sumario diario + legislación consolidada),
  respuestas en XML/JSON.
- Herramienta propuesta: `buscar_boe(termino, fecha?)` → entradas del sumario con enlace al PDF/XML.
- Caso ciudadano: *"¿Qué bienes declaró tal cargo?"* (localizar la publicación en BOE).

## 3) Retribuciones de altos cargos — Portal de Transparencia

- Excepción donde el dato **sí** vive en transparencia.gob.es. Probablemente requiere scraping ligero
  (no hay API limpia). Menor prioridad técnica.

## 4) Descubrimiento "¿qué existe?" — datos.gob.es (SPARQL)

- Catálogo CKAN con endpoint **SPARQL** (`https://datos.gob.es/es/sparql`) para responder "¿hay un
  dataset sobre X?" antes de ir a la fuente. Útil como capa de orientación previa (OPP-1a.2).

## 5) Contratos: mejoras (stretch de la propia v1)

- Parsear el ATOM **en vivo** desde la edge function (datos siempre frescos) en vez de dataset
  precocinado.
- Incluir el conjunto de **contratos menores** (fichero aparte).
- Agregar plataformas autonómicas que sindican hacia PLACSP.

## 6) Monitorización de cambios (OPP-1b)

- Vigilancia de fuentes conocidas con herramientas maduras (changedetection.io) + alertas. Fuera del
  núcleo conversacional, pero alto valor/coste bajo.

---

**Principio transversal:** cada vertical mantiene las reglas de oro (citar siempre, no inventar, no
hacer periodismo/legal) y traduce la jerga propia de su portal a lenguaje ciudadano.
