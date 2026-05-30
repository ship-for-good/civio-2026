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
  documents_arcana_graph: true,
  enable_arcana_services: true,
  storage_module: SQLete.Storage.S3,
  storage_bucket: "sqlete-pdfs"

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

config :sqlete, Oban,
  engine: Oban.Engines.Basic,
  notifier: Oban.Notifiers.Postgres,
  queues: [pdf_ingestion: 5, default: 10],
  repo: SQLete.Repo

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
