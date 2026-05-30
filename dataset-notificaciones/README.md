# Dataset de notificaciones/resoluciones (derecho de acceso)

Corpus de PDFs **reales y públicos** de resoluciones del derecho de acceso a la información, recopilado para entrenar/validar el clasificador de la app OPP-2 y para generar PDFs sintéticos calcados del formato real.

## Contenido

- **`pdfs/`** — 318 PDFs descargados (153 MB).
- **`index.csv`** — índice con una fila por documento. Cabeceras unificadas:

  `source, doc_type, ambito, organismo, asunto, fecha, expediente_id, reclamacion_ref, resolucion_sentido, pdf_url, local_path, download_status, http_status, size_bytes, notes`

- **`harvest.py`** — script que descarga los PDFs desde las URLs descubiertas y construye el CSV. Reejecutable: `python3 harvest.py <ruta_al_json_del_workflow>`.

## Composición (documentos descargados OK)

| Dimensión | Reparto |
|-----------|---------|
| **Tipo** | reclamacion_ctbg 126 · resolucion_estimatoria 85 · resolucion_desestimatoria 64 · resolucion_parcial 18 · guía/modelo 20 · otro 5 |
| **Sentido** | estimatoria 152 · desestimatoria 80 · inadmisión 20 · parcial 23 · n/a 43 |
| **Ámbito** | AGE 215 · autonómico 84 · local 19 |

Fuentes: Consejo de Transparencia y Buen Gobierno (CTBG), Portal de Transparencia del Estado (resoluciones denegatorias), páginas de transparencia de ministerios, portales autonómicos/locales, datos.gob.es y guías/modelos oficiales.

## ⚠️ Notas importantes

- **Faltan los tipos `inicio_tramitacion` y `prorroga`**: son notificaciones internas que casi no se publican online. El corpus cubre bien las **resoluciones** (estimatoria/desestimatoria/parcial/inadmisión) y las **reclamaciones del CTBG**; los avisos de inicio/prórroga hay que **sintetizarlos** (imitando el formato de estos) o pedírselos a Civio.
- Las resoluciones del CTBG ya vienen **anonimizadas** en origen. Aun así, revisar antes de publicar nada.
- 46 URLs no se descargaron (404/errores/redirecciones); quedan registradas en el CSV con su `download_status` para reintentar si interesa.
- Uso conforme a la política de IA de Civio: estos documentos alimentan **clasificación/extracción de datos**, no generación de texto periodístico/legal.
