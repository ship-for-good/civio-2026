### User Story 1: Investigative Journalist

> **As an** investigative journalist researching public expenditure,
> **I want to** be routed directly to the specific electronic submission form for the Ministry of Finance (Ministerio de Hacienda),
> **So that** I can formally register my Right of Access request without getting lost in general informational pages.

**Acceptance Criteria**

- **Trigger:** The user searches for a combination of access keywords and a specific entity (e.g., "solicitud acceso información Ministerio de Hacienda" or "pedir contratos Hacienda").
- **Navigation Bypass:** The system bypasses or provides a direct link through the general `derecho-acceso` informational page.
- **Target Resolution:** The user successfully lands on the specific Sede Electrónica URL for the Ministry of Finance: `[https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514](https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514)`.
- **Actionability:** The landing page clearly displays the "Acceder al Procedimiento" (Access Procedure) button to authenticate via Cl@ve or Digital Certificate.

---

### User Story 2: Everyday Citizen

> **As a** citizen who wants to request information about a specific public subsidy,
> **I want to** select the relevant government agency and be taken straight to its specific application portal,
> **So that** I can complete my transparency request online quickly and securely.

**Acceptance Criteria**

- **Trigger:** The user inputs a query indicating a desire to ask a specific department for documents (e.g., "reclamación documentos subvenciones" followed by selecting the relevant Ministry).
- **Entity Mapping:** The system correctly maps the user's intent to the specific organism's ID (e.g., mapping "Hacienda" to `idAmb=101514`).
- **Target Resolution:** The user is redirected to the actionable form URL corresponding to that entity (e.g., `[https://transparencia.sede.gob.es/procedimiento/portada?idProc=](https://transparencia.sede.gob.es/procedimiento/portada?idProc=)[ID]&idAmb=[Agency_ID]`).
- **Error Handling:** If the user does not specify a ministry initially, the system prompts them to select the specific organism before generating the final `transparencia.sede.gob.es` link.
