# Spanish Government Entities — Transparency Access Mapping

**Status:** v1 — Direct certificate-based access to transparency request forms

This document maps Spain's 25 government entities (ministries and agencies) to their transparency access form endpoints on the Portal de la Transparencia de la Administración General del Estado (AGE).

## Overview

Each entity has a unique `idAmb` (ámbito ID) that routes users to the correct ministry/agency form for filing transparency access requests under Ley 19/2013.

- **System:** Portal de la Transparencia AGE
- **Base URL:** https://transparencia.sede.gob.es
- **Procedure:** Ejercicio del derecho de acceso a información pública
- **Procedure ID:** 133628
- **Auth Methods:** Cl@ve, FNMT certificate, DNI-e

## Entity Mapping (25 entities)

All data is available in JSON format at `scripts/explore-urls-output.json`:

```bash
# To use the mapping:
import entities from './scripts/explore-urls-output.json';

const entity = entities.entities.find(e => e.idAmb === 101526);
// Navigate user to: entity.certAuthUrl
```

### Entity IDs (idAmb) Reference

| idAmb | Ministry/Agency |
|-------|-----------------|
| 101503 | Agencia Española de Protección de Datos |
| 101504 | Casa Real |
| 101505 | Secretaría de Estado de la Seguridad Social y Pensiones |
| 101506 | Ministerio de Agricultura, Pesca y Alimentación |
| 101507 | Ministerio de Asuntos Exteriores, Unión Europea y Cooperación |
| 101508 | Ministerio de Ciencia, Innovación y Universidades |
| 101509 | Ministerio de Cultura |
| 101510 | Ministerio de Defensa |
| 101511 | Ministerio de Derechos Sociales, Consumo y Agenda 2030 |
| 101512 | Ministerio de Economía, Comercio y Empresa |
| 101513 | Ministerio de Educación, Formación Profesional y Deportes |
| 101514 | Ministerio de Hacienda |
| 101515 | Ministerio de Igualdad |
| 101516 | Ministerio de Inclusión, Seguridad Social y Migraciones |
| 101517 | Ministerio de Industria y Turismo |
| 101518 | Ministerio del Interior |
| 101519 | Ministerio de Juventud e Infancia |
| 101520 | Ministerio de Política Territorial y Memoria Democrática |
| 101521 | Ministerio de la Presidencia, Justicia, y Relaciones con Cortes |
| 101522 | Ministerio de Sanidad |
| 101523 | Ministerio de Trabajo y Economía Social |
| 101524 | Ministerio para la Transformación Digital y de la Función Pública |
| 101525 | Ministerio para la Transición Ecológica y el Reto Demográfico |
| 101526 | Ministerio de Transportes y Movilidad Sostenible |
| 101527 | Ministerio de Vivienda y Agenda Urbana |

## URL Pattern

For each entity, the direct access URL follows this pattern:

```
https://transparencia.sede.gob.es/procedimiento/formulario?idProc=133628&idAmb={idAmb}
```

Example for Ministerio de Transportes (idAmb=101526):
```
https://transparencia.sede.gob.es/procedimiento/formulario?idProc=133628&idAmb=101526
```

## Authentication Flow

1. User navigates to the form endpoint above
2. Portal redirects to certificate authentication
3. User selects certificate from OS keychain:
   - **FNMT Certificate** (Fábrica Nacional de Moneda y Timbre) — standard citizen cert
   - **DNI-e** — electronic national ID
   - **Cl@ve** — simplified government identity
4. Session established with the Portal
5. User fills and submits the transparency request form
6. Portal generates `expedienteRef` (case reference) as proof

## Integration with v1 Buscador

The buscador LLM classifier identifies which entity/ministry holds the requested information, then returns the entity's `certAuthUrl` so the user can navigate directly to the form.

### Example Flow

```
User Query: "Contratos de limpieza del Ayuntamiento de Madrid"
   ↓
LLM Classification: idAmb=101526 (Transportes ministry — contratos)
   ↓
UI Response: "Solicitar a Ministerio de Transportes"
   ↓
User Clicks Link: https://transparencia.sede.gob.es/procedimiento/formulario?idProc=133628&idAmb=101526
   ↓
Portal: Certificate auth → form visible → user submits → proof generated
```

## Data Source

Entity mapping data comes from:
- **PideInfo GitHub:** `/src/Command/AssignTransparencyPortalAmbCommand.php` (confirmed AMBITOS constant)
- **Verified against:** Live portal transparencia.sede.gob.es (2026-05-30)
- **Source:** Portal de la Transparencia de la Administración General del Estado (AGE)

## References

- [Portal de la Transparencia](https://transparencia.gob.es/)
- [Ley 19/2013 de Transparencia](https://www.boe.es/buscar/act.php?id=BOE-A-2013-12887)
- [PideInfo — Transparency Request Management](https://pideinfo.es/)
- [FNMT Certificates](http://www.cert.fnmt.es/)
