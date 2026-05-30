# This file is responsible for configuring your application
# and its dependencies with the aid of the Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
import Config

config :sqlete, SQLete.Repo, types: SQLete.PostgrexTypes

config :sqlete,
  namespace: SQLete,
  ecto_repos: [SQLete.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true],
  documents_pipeline: SQLete.Documents.Pipeline,
  documents_ingestor: SQLete.Documents.ArcanaIngestor,
  documents_arcana_collection: "documents",
  # Structured field extraction (FieldExtractor) feeds the dashboard; the GraphRAG
  # graph is off by default to keep the fragile per-chunk LLM path out of ingestion.
  documents_arcana_graph: true,
  # Vector embeddings (Arcana.ingest) are not needed by the dashboard and add a
  # per-chunk LLM cost + failure surface; off by default for ingestion.
  documents_arcana_embeddings: true,
  enable_arcana_services: true,
  storage_module: SQLete.Storage.S3,
  storage_bucket: "sqlete-pdfs",
  # Read-side source for the inbox UI: Ecto-backed, reads the document_files columns
  # filled by ingestion (FieldExtractor).
  inbox_source: SQLete.Inbox.EctoSource

config :arcana,
  repo: SQLete.Repo,
  embedder: SQLete.Embedder,
  llm: &SQLete.LLM.complete/3,
  pdf_parser: :poppler,
  graph: [
    enabled: false,
    extractor: SQLete.Graph.NotificationExtractor,
    relationship_extractor: nil,
    community_summarizer: nil
  ]

config :req, :default_options, finch: SQLete.Finch

config :sqlete, Oban,
  engine: Oban.Engines.Basic,
  notifier: Oban.Notifiers.Postgres,
  queues: [pdf_ingestion: 5, llm_processing: 3, default: 10, alerts: 5],
  # Cron runs in UTC (no tzdata dep). 07:00 UTC ≈ 08:00-09:00 Europe/Madrid.
  plugins: [
    {Oban.Plugins.Cron, crontab: [{"0 7 * * *", SQLete.Alerts.ScanWorker}]}
  ],
  repo: SQLete.Repo

# Deadline alerts. Adapters default to the no-op Fake (no cost / no account);
# runtime.exs switches them to Twilio when ALERTS_PROVIDER=twilio. Default channel
# is SMS (most reliable; voice is kept for when leaving the Twilio trial).
config :sqlete, :voice_adapter, SQLete.Notifications.Voice.Fake
config :sqlete, :sms_adapter, SQLete.Notifications.Sms.Fake
config :sqlete, :alerts, threshold_days: 5, channel: :sms

# Configure the endpoint
config :sqlete, SQLeteWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: SQLeteWeb.ErrorHTML, json: SQLeteWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: SQLete.PubSub,
  live_view: [signing_salt: "hraoqeAn"]

# Configure the mailer
#
# By default it uses the "Local" adapter which stores the emails
# locally. You can see the emails in your browser, at "/dev/mailbox".
#
# For production it's recommended to configure a different adapter
# at the `config/runtime.exs`.
config :sqlete, SQLete.Mailer, adapter: Swoosh.Adapters.Local

# Configure esbuild (the version is required)
config :esbuild,
  version: "0.25.4",
  sqlete: [
    args:
      ~w(js/app.js --bundle --target=es2022 --outdir=../priv/static/assets/js --external:/fonts/* --external:/images/* --alias:@=.),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => [Path.expand("../deps", __DIR__), Mix.Project.build_path()]}
  ]

# Configure tailwind (the version is required)
config :tailwind,
  version: "4.1.12",
  sqlete: [
    args: ~w(
      --input=assets/css/app.css
      --output=priv/static/assets/css/app.css
    ),
    cd: Path.expand("..", __DIR__)
  ]

# Configure Gettext locales
config :sqlete, SQLeteWeb.Gettext, locales: ["en", "es"], default_locale: "es"

# Configure Elixir's Logger
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{config_env()}.exs"
