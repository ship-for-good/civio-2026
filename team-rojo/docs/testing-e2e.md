# E2E Testing: User Stories & Happy Path Scenarios

## Background

The "buscador" (search engine) helps citizens navigate to the correct government
portal for public information requests. When the AI classifies a query as
"Right of Access" (`derecho_acceso`), it generates a deep link to the
corresponding entity's form on `transparencia.sede.gob.es`.

> **Target flow:** Home (`/{locale}/buscador`) → AI classification →
> Deep link to `transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb={entity}`

---

## User Story A — Civio / Power User

> **As a** Civio power user,
> **I want** to type a precise query (e.g. "solicitud acceso información
> Ministerio de Hacienda") and be taken directly to the right-of-access form
> on the Ministry of Finance's sede,
> **so that** I can submit a formal access request without browsing multiple
> portals.

### Acceptance Criteria

| # | Criterion |
|---|-----------|
| A1 | The buscador accepts a query containing a ministry name (e.g. "Hacienda") and classifies it as `derecho_acceso`. |
| A2 | The result card displays the deep-link button "Ir al portal (búsqueda lista)". |
| A3 | The deep-link `href` matches the expected pattern for Ministerio de Hacienda: `https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514`. |
| A4 | Clicking the button opens `transparencia.sede.gob.es` in a new tab with the correct `idProc` and `idAmb` parameters. |
| A5 | The destination page loads a valid right-of-access procedure for the Ministerio de Hacienda. |

---

## User Story B — Average Citizen / First-Time User

> **As a** citizen who has never exercised their right of access,
> **I want** to type a casual question (e.g. "quiero pedir información al
> ministerio de hacienda"), get clear step-by-step instructions, and be
> guided to the correct form,
> **so that** I can successfully submit my first transparency request without
> legal or technical knowledge.

### Acceptance Criteria

| # | Criterion |
|---|-----------|
| B1 | The buscador accepts a casual/natural language query and classifies it correctly. |
| B2 | The result card shows a human-readable explanation of the Right of Access procedure. |
| B3 | The "Step guide" section displays 3–5 actionable steps. |
| B4 | The deep-link button is present when the entity is detected. |
| B5 | If the user omits the entity name (e.g. "quiero pedir información"), no deep link is generated and the user is prompted to select a ministry. |

---

## Happy Path — Gherkin Scenarios

```gherkin
Feature: Right of Access — Direct routing to Ministerio de Hacienda
  As a citizen
  I want the buscador to classify my request and take me to the correct form
  So that I can exercise my right of access without navigating multiple portals

  Background:
    Given the buscador is accessible at "/{locale}/buscador"
    And the API endpoint "/api/buscador/classify" returns mock data for testing

  Scenario: Civio power user requests access to Hacienda data
    Given I navigate to the buscador page
    When I type "solicitud acceso información Ministerio de Hacienda"
    And I submit the query
    Then I see a result card for "Sede Electrónica — Derecho de Acceso"
    And the deep-link URL matches "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
    And the "Ir al portal" button is visible and opens in a new tab
    When I open the deep link in a new tab
    Then the page loads the Ministerio de Hacienda's right-of-access procedure
    And the page title contains "Ministerio de Hacienda" or "Hacienda"

  Scenario: First-time citizen uses casual language
    Given I navigate to the buscador page
    When I type "quiero pedir información al ministerio de hacienda"
    And I submit the query
    Then I see a result card for "Sede Electrónica — Derecho de Acceso"
    And the explanation mentions "derecho de acceso"
    And the step guide contains between 3 and 5 steps
    And the deep-link points to the Ministerio de Hacienda procedure
```
