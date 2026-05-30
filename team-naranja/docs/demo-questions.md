# Preguntas de prueba · Demo y validación

Usar estas preguntas para validar el asistente antes de la entrega (17:00 checkpoint).

| # | Pregunta | Status esperado | Topic esperado |
|---|---|---|---|
| 1 | ¿Cuánto cobran los altos cargos del gobierno? | `found` | retribuciones-altos-cargos |
| 2 | ¿Cuánto cobran los ministros? | `found` | retribuciones-altos-cargos |
| 3 | ¿Quién son los asesores de los ministerios? | `not_found` | personal-eventual-asesores |
| 4 | Contratos de obras de un colegio en Barcelona | `external` | contratos-publicos-plataforma |
| 5 | ¿Dónde están las subvenciones públicas? | `linked` | subvenciones-bdns |

## Cómo probar

### Edge Function (curl)

```bash
curl -X POST 'https://<PROJECT_REF>.supabase.co/functions/v1/ask' \
  -H 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"query":"¿Cuánto cobran los ministros?"}'
```

### UI (Lovable)

1. Abrir URL publicada
2. Pulsar sugerencia o escribir pregunta
3. Verificar card correcta (verde / ámbar / rojo)

## Criterios de aceptación

- [ ] Pregunta 1 → card verde + enlace a transparencia.gob.es
- [ ] Pregunta 3 → wizard 3 pasos + botón copiar plantilla
- [ ] Pregunta 4 → card ámbar + enlace contrataciondelestado.es
- [ ] Latencia < 3 seg en modo mock; < 5 seg con Edge Function
