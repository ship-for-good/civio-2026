# SQLete

To start your Phoenix server:

* Run `mix setup` to install and setup dependencies
* Start Phoenix endpoint with `mix phx.server` or inside IEx with `iex -S mix phx.server`

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## AI providers

The app uses OpenAI for embeddings and extraction/generation.

Set `OPENAI_API_KEY` plus optional overrides such as `OPENAI_BASE_URL`, `OPENAI_EMBEDDER_MODEL`, `OPENAI_EMBEDDER_DIMENSIONS`, `OPENAI_LLM_MODEL`, `OPENAI_LLM_TIMEOUT`, `OPENAI_LLM_MAX_TOKENS`, and `OPENAI_LLM_TEMPERATURE`.

Example setup:

```sh
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDER_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4o-mini
```

## Ingesting the dataset PDFs

The `dataset-notificaciones/pdfs` directory contains ~320 real transparency PDFs. Use the mix task to ingest them through the pipeline:

```sh
mix sqlete.ingest_pdfs ../dataset-notificaciones/pdfs
```

### Prerequisites

Make sure the database and MinIO are running before ingesting:

```sh
docker compose up -d
mix ecto.setup
```

## Deploy (CI/CD)

The app is built into a Docker image, pushed to DockerHub (`dieg666/sqlete`, public),
and deployed to an EC2 host running `docker compose`. Everything (Postgres + MinIO)
runs in the same compose stack — no RDS, no managed S3.

- Workflow: `.github/workflows/deploy.yml`. Triggers on push to `main` and via
  manual `workflow_dispatch`.
- Production stack: `sqlete/docker-compose.prod.yml` (services `db`, `minio`, `app`).
  The app is served over plain HTTP at `http://<EC2_HOST>/` (port 80 → container 4000).

### GitHub config required

- Variables: `DOCKERHUB_USER`, `EC2_HOST`, `EC2_USER`.
- Secrets: `DOCKERHUB_SECRET`, `EC2_SSH_KEY`, **`SECRET_KEY_BASE`** (add this one;
  generate with `mix phx.gen.secret` and keep it stable across deploys).

### EC2 prerequisites

- Docker + the `docker compose` plugin installed; the deploy user in the `docker` group.
- Security Group inbound: TCP **80** (HTTP) and **22** (SSH).

### Enabling AI in production

Production defaults to `AI_PROVIDER=openai` (see "AI providers" above). Set `OPENAI_API_KEY`
as an env var on the `app` service to enable the PDF extraction pipeline; otherwise the app
boots and the UI is navigable, but PDF processing will fail until a provider is configured.

## Learn more

* Official website: https://www.phoenixframework.org/
* Guides: https://hexdocs.pm/phoenix/overview.html
* Docs: https://hexdocs.pm/phoenix
* Forum: https://elixirforum.com/c/phoenix-forum
* Source: https://github.com/phoenixframework/phoenix
