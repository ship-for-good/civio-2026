# SQLete — Civio Inbox

Aplicación web para el **seguimiento de solicitudes de derecho de acceso** (reto OPP-2).

Arrastras el PDF de una notificación y la app lo **interpreta con IA** (tipo de respuesta + fechas), **calcula los plazos legales** automáticamente, te **avisa de lo que vence** y **detecta cuando una solicitud se ha multiplicado** en varios expedientes.

## Stack

- **Phoenix / Elixir** (LiveView) + **PostgreSQL** + MinIO (S3)
- IA (OpenAI) para extracción, clasificación y embeddings
- Oban para jobs y alertas

## Arranque rápido

```sh
cd sqlete
docker compose up -d        # PostgreSQL + MinIO
mix setup                   # deps + migraciones + assets
mix phx.server              # http://localhost:4000
```

Configura `OPENAI_API_KEY` (ver `sqlete/README.md` para los overrides disponibles).

## Ingesta del dataset

```sh
cd sqlete
mix sqlete.ingest_pdfs ../dataset-notificaciones/pdfs
```

## Más info

- Definición del proyecto: [`PROYECTO-OPP2-DEFINICION.md`](PROYECTO-OPP2-DEFINICION.md)
- Detalles de la app: [`sqlete/README.md`](sqlete/README.md)
