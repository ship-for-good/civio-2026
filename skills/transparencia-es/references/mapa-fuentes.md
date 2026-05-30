# Mapa de fuentes — qué información pública vive en qué portal

El "Portal de Transparencia" (transparencia.gob.es) es, en gran parte, un **directorio de
enlaces**: rara vez aloja el dato; te deriva a otra parte. Esta es la chuleta de Civio sobre
**dónde está la información de verdad**. La **v1 de la skill implementa Contratos**; el resto se
orienta aquí y está en el roadmap (no inventes datos de esas materias).

| Quieres saber…                          | Fuente primaria real                         | Acceso / datos                                   | Estado en la skill |
|-----------------------------------------|----------------------------------------------|--------------------------------------------------|--------------------|
| **Contratos y licitaciones públicas**   | Plataforma de Contratación del Sector Público (PLACSP) | contrataciondelestado.es · datos abiertos ATOM/ZIP mensual | ✅ Implementado (v1) |
| **Subvenciones y ayudas públicas**      | Base de Datos Nacional de Subvenciones (BDNS)| infosubvenciones.es · **API REST** pública sin auth | 🔜 Roadmap        |
| **Bienes patrimoniales de altos cargos**| **BOE** (el portal solo enlaza)              | boe.es · API de datos abiertos (sumario)         | 🔜 Roadmap         |
| **Retribuciones de altos cargos**       | **Portal de Transparencia** (excepción: aquí sí está) | transparencia.gob.es                      | 🔜 Roadmap         |
| **Leyes y normativa (texto consolidado)**| BOE — Legislación Consolidada               | boe.es/datosabiertos · API REST                  | 🔜 Roadmap         |
| **¿Qué datasets existen? (catálogo)**   | datos.gob.es                                 | CKAN + endpoint **SPARQL**                       | 🔜 Roadmap (descubrimiento) |

## Regla de derivación

Si la pregunta **no** es de contratación:
1. Identifica la materia en la tabla y nombra la **fuente primaria** correcta con su URL.
2. Explica brevemente cómo buscar allí.
3. Aclara que la consulta automatizada de esa fuente **aún no está implementada** en esta versión
   (está en `roadmap-verticales.md`) y **no inventes** los datos.

## URLs de referencia

- PLACSP: <https://contrataciondelestado.es>
- BDNS (subvenciones): <https://www.infosubvenciones.es/bdnstrans/es/index>
- BOE datos abiertos: <https://www.boe.es/datosabiertos/api/api.php>
- Portal de Transparencia: <https://transparencia.gob.es>
- Catálogo de datos abiertos: <https://datos.gob.es> · SPARQL: <https://datos.gob.es/es/sparql>
