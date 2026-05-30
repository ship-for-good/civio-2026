### Test Suite 1: Investigative Journalist (Direct Routing)

Feature: Direct routing to specific entity's Right of Access form
As an investigative journalist
I want to search for a specific ministry's access form
So that I can bypass general information and start my request immediately

Scenario: Successful direct routing to the Ministry of Finance
Given the user is on the main search interface of the transparency portal
When the user enters the search query "solicitud acceso información Ministerio de Hacienda"
And the user submits the query
Then the system should recognize the intent keywords "solicitud" and "acceso información"
And the system should identify the target entity as "Ministerio de Hacienda"
And the system should bypass the general "https://transparencia.gob.es/transparencia/atencion-ciudadano/derecho-acceso" URL
And the system should redirect the user to the specific Sede Electrónica URL: "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
And the landing page should contain the button "Acceder al Procedimiento"

### Test Suite 2: Everyday Citizen (Interactive Routing & Error Handling)

Feature: Interactive routing for incomplete Right of Access requests
As a citizen
I want to be guided to the correct agency's form if I don't know the exact URL
So that I can successfully submit my request

Scenario: System prompts for missing entity
Given the user is on the main search interface of the transparency portal
When the user enters the search query "reclamación documentos subvenciones"
And the user submits the query
Then the system should recognize the intent keywords "reclamación" and "documentos"
But the system should detect that no specific Ministry or Agency has been specified
And the system should display a prompt asking: "Please select the Ministry or Agency you want to request information from"
And the system should provide a list or dropdown of available government entities

Scenario: System resolves URL after entity selection
Given the user is on the entity selection prompt for a Right of Access request
When the user selects "Ministerio de Hacienda" from the list of available entities
And the user confirms the selection
Then the system should map the selected entity to the internal parameter "idAmb=101514"
And the system should construct the final procedural URL
And the system should redirect the user to "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"

### Test Suite 3: Fallback & Edge Cases

Feature: Fuzzy search fallback for typos in keywords
As any user
I want the system to understand my intent even if I make a typo
So that I can still reach the correct electronic form

Scenario: User makes a typo in the keyword but specifies the entity
Given the user is on the main search interface
When the user enters the search query "solistud aceso Hacienda"
And the system config has "fallback_strategy" set to "fuzzy_search"
Then the system should map "solistud aceso" to the "derecho_acceso" keyword list
And the system should identify the entity as "Ministerio de Hacienda"
And the system should redirect the user to "https://transparencia.sede.gob.es/procedimiento/portada?idProc=133628&idAmb=101514"
