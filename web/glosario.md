# Glosario CPV — traducir "lenguaje de calle" a códigos de contratación

## ¿Qué es un CPV?

**CPV = Common Procurement Vocabulary** (Vocabulario Común de Contratos Públicos). Es una
clasificación europea que pone un **código numérico al *objeto*** de un contrato: para qué es.
Tiene 8 dígitos + 1 de control (`########-#`) y es jerárquico: los primeros dígitos marcan la
familia y, cuanto más a la derecha, más específico.

- `45000000` = Trabajos de **construcción** (familia entera).
- `45214210` = Trabajos de construcción de **centros de enseñanza primaria** (muy específico).

**Por qué importa:** el ciudadano dice "el colegio nuevo" o "la limpieza del parque"; el portal
solo entiende CPV. El trabajo de la skill es **traducir** la pregunta a uno o varios CPV. Puedes
filtrar por **prefijo** (ej. `4521` para "edificios educativos" en general) cuando no sepas el
código exacto.

## Cómo elegir el CPV

1. Identifica la **familia** por los 2 primeros dígitos (ver tabla de familias).
2. Afina si el usuario da detalle; si no, usa un **prefijo** amplio y dilo ("busco en todo `4521*`,
   que cubre edificios educativos").
3. Si dudas entre varios, busca con los más probables y explica el criterio.

## Familias CPV más útiles para preguntas ciudadanas (2 primeros dígitos)

| Prefijo | Familia                                  | Ejemplos ciudadanos                          |
|--------:|------------------------------------------|----------------------------------------------|
| `45`    | Construcción / obras                     | colegios, calles, polideportivos, reformas   |
| `90`    | Servicios de saneamiento/medio ambiente  | limpieza viaria, basuras, parques            |
| `71`    | Servicios de arquitectura e ingeniería   | proyectos, direcciones de obra               |
| `79`    | Servicios empresariales                  | consultoría, eventos, publicidad, seguridad  |
| `85`    | Servicios de salud y asistencia social   | ayuda a domicilio, residencias               |
| `80`    | Servicios de enseñanza y formación       | cursos, formación                            |
| `48`/`72`| Software / servicios TI                  | aplicaciones, mantenimiento informático      |
| `09`/`31`| Energía / electricidad                   | suministro eléctrico, alumbrado              |
| `15`    | Alimentación                             | comedores escolares, catering                |
| `34`    | Equipos de transporte                    | autobuses, vehículos                         |
| `33`    | Equipos y material sanitario             | material hospitalario, medicamentos          |
| `50`    | Servicios de reparación y mantenimiento  | mantenimiento de edificios/instalaciones     |

## Tabla de CPV concretos frecuentes (para mapear rápido)

| CPV        | Significado (en claro)                                        |
|------------|--------------------------------------------------------------|
| `45000000` | Trabajos de construcción (genérico)                          |
| `45214200` | Construcción de edificios relacionados con la enseñanza      |
| `45214210` | Construcción de centros de enseñanza **primaria**            |
| `45214220` | Construcción de centros de enseñanza **secundaria**          |
| `45210000` | Construcción de edificios                                    |
| `45233140` | Obras viales (calles, carreteras)                            |
| `45112700` | Trabajos de paisajismo (parques, zonas verdes)               |
| `90910000` | Servicios de limpieza                                        |
| `90511000` | Recogida de basuras                                          |
| `71200000` | Servicios de arquitectura                                    |
| `71300000` | Servicios de ingeniería                                      |
| `79952000` | Servicios de organización de eventos                         |
| `79710000` | Servicios de seguridad / vigilancia                          |
| `85310000` | Servicios de asistencia social (ayuda a domicilio)           |
| `80000000` | Servicios de enseñanza y formación                           |
| `48000000` | Paquetes de software y sistemas de información               |
| `72000000` | Servicios TI: consultoría, desarrollo, mantenimiento         |
| `09310000` | Electricidad (suministro)                                    |
| `15000000` | Alimentos, bebidas (comedores, catering)                     |
| `34121000` | Autobuses                                                    |
| `33600000` | Productos farmacéuticos                                      |

> Si necesitas un CPV que no está aquí, dilo y usa el prefijo de familia más cercano. El listado
> oficial completo lo publica la Comisión Europea (Reglamento CPV); para la demo basta con esta
> tabla y los prefijos.
