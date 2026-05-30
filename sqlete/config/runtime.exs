import Config

# config/runtime.exs is executed for all environments, including
# during releases. It is executed after compilation and before the
# system starts, so it is typically used to load production configuration
# and secrets from environment variables or elsewhere. Do not define
# any compile-time configuration in here, as it won't be applied.
# The block below contains prod specific runtime configuration.

# ## Using releases
#
# If you use `mix release`, you need to explicitly enable the server
# by passing the PHX_SERVER=true when you start it:
#
#     PHX_SERVER=true bin/sqlete start
#
# Alternatively, you can use `mix phx.gen.release` to generate a `bin/server`
# script that automatically sets the env var above.
if System.get_env("PHX_SERVER") do
  config :sqlete, SQLeteWeb.Endpoint, server: true
end

# Dev/test convenience: load the repo-root .env (if present) so OPENAI_API_KEY and
# friends are available without manually `source`-ing it before `mix phx.server`.
# Real environment variables always win, and this never runs in :prod.
if config_env() != :prod do
  dotenv = Path.expand("../../.env", __DIR__)

  if File.exists?(dotenv) do
    dotenv
    |> File.stream!()
    |> Enum.each(fn line ->
      trimmed = line |> String.trim() |> String.replace_prefix("export ", "")

      case String.split(trimmed, "=", parts: 2) do
        [key, value] ->
          key = String.trim(key)

          if not String.starts_with?(trimmed, "#") and key != "" and
               System.get_env(key) in [nil, ""] do
            System.put_env(key, value |> String.trim() |> String.trim("\""))
          end

        _ ->
          :ok
      end
    end)
  end
end

env_integer = fn name, default ->
  name
  |> System.get_env(Integer.to_string(default))
  |> String.to_integer()
end

env_float = fn name, default ->
  case System.get_env(name) do
    nil ->
      default

    value ->
      case Float.parse(value) do
        {number, ""} -> number
        _other -> default
      end
  end
end

ai_config = SQLete.AIConfig.runtime_config(config_env(), System.get_env())

config :sqlete, :embedder, ai_config.embedder
config :sqlete, :llm, ai_config.llm

pdf_ingestion_queue_concurrency =
  System.get_env("OBAN_PDF_INGESTION_CONCURRENCY", "5")
  |> String.to_integer()

llm_processing_queue_concurrency =
  System.get_env("OBAN_LLM_PROCESSING_CONCURRENCY", "3")
  |> String.to_integer()

default_queue_concurrency =
  System.get_env("OBAN_DEFAULT_QUEUE_CONCURRENCY", "10")
  |> String.to_integer()

config :sqlete, Oban,
  queues: [
    pdf_ingestion: pdf_ingestion_queue_concurrency,
    llm_processing: llm_processing_queue_concurrency,
    default: default_queue_concurrency,
    alerts: 5
  ]

config :sqlete, SQLeteWeb.Endpoint,
  http: [port: String.to_integer(System.get_env("PORT", "4000"))]

# --- Deadline-alert voice calls --------------------------------------------
# Global destination number for the alert calls (per-expediente override lives in
# the DB). Threshold (days remaining that triggers the call) is configurable too.
alerts_threshold_days =
  case System.get_env("ALERTS_THRESHOLD_DAYS") do
    value when value in [nil, ""] -> 5
    value -> String.to_integer(value)
  end

alerts_channel =
  case System.get_env("ALERTS_CHANNEL") do
    "call" -> :call
    "both" -> :both
    _ -> :sms
  end

config :sqlete, :alerts,
  to_number: System.get_env("ALERT_TO_NUMBER"),
  threshold_days: alerts_threshold_days,
  channel: alerts_channel

# Provider for both SMS and voice. Twilio when ALERTS_PROVIDER=twilio; otherwise the
# no-op Fake set in config.exs. Never auto-switched in :test so tests stay offline.
if config_env() != :test and System.get_env("ALERTS_PROVIDER") == "twilio" do
  twilio = [
    account_sid: System.get_env("TWILIO_ACCOUNT_SID"),
    auth_token: System.get_env("TWILIO_AUTH_TOKEN"),
    from: System.get_env("TWILIO_FROM_NUMBER")
  ]

  config :sqlete, :voice_adapter, SQLete.Notifications.Voice.Twilio
  config :sqlete, :sms_adapter, SQLete.Notifications.Sms.Twilio
  config :sqlete, SQLete.Notifications.Voice.Twilio, twilio
  config :sqlete, SQLete.Notifications.Sms.Twilio, twilio
end

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise """
      environment variable DATABASE_URL is missing.
      For example: ecto://USER:PASS@HOST/DATABASE
      """

  maybe_ipv6 = if System.get_env("ECTO_IPV6") in ~w(true 1), do: [:inet6], else: []

  config :sqlete, SQLete.Repo,
    # ssl: true,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    # For machines with several cores, consider starting multiple pools of `pool_size`
    # pool_count: 4,
    socket_options: maybe_ipv6

  # The secret key base is used to sign/encrypt cookies and other secrets.
  # A default value is used in config/dev.exs and config/test.exs but you
  # want to use a different value for prod and you most likely don't want
  # to check this value into version control, so we use an environment
  # variable instead.
  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise """
      environment variable SECRET_KEY_BASE is missing.
      You can generate one by calling: mix phx.gen.secret
      """

  host = System.get_env("PHX_HOST") || "example.com"

  # URL scheme/port are configurable so the app can be served over plain HTTP
  # (e.g. http://IP:80) without TLS. Defaults keep the standard HTTPS behaviour.
  url_scheme = System.get_env("URL_SCHEME", "https")
  url_port = String.to_integer(System.get_env("URL_PORT", "443"))

  config :sqlete, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  config :sqlete, SQLeteWeb.Endpoint,
    url: [host: host, port: url_port, scheme: url_scheme],
    # Hackathon: served by IP over HTTP, so relax origin checking to avoid
    # LiveView socket rejections. Tighten this once a real domain is in place.
    check_origin: false,
    http: [
      # Enable IPv6 and bind on all interfaces.
      # Set it to  {0, 0, 0, 0, 0, 0, 0, 1} for local network only access.
      # See the documentation on https://hexdocs.pm/bandit/Bandit.html#t:options/0
      # for details about using IPv6 vs IPv4 and loopback vs public addresses.
      ip: {0, 0, 0, 0, 0, 0, 0, 0}
    ],
    secret_key_base: secret_key_base

  # MinIO / S3-compatible object storage (PDF uploads). In dev this lives in
  # config/dev.exs; for releases we configure it here from env vars.
  config :ex_aws,
    access_key_id: System.get_env("MINIO_ACCESS_KEY", "minio"),
    secret_access_key: System.get_env("MINIO_SECRET_KEY", "minio123"),
    region: System.get_env("MINIO_REGION", "us-east-1")

  config :ex_aws, :s3,
    scheme: "http://",
    host: System.get_env("MINIO_HOST", "minio"),
    port: String.to_integer(System.get_env("MINIO_PORT", "9000")),
    virtual_host: false

  config :sqlete, :storage_bucket, System.get_env("STORAGE_BUCKET", "sqlete-pdfs")

  # ## SSL Support
  #
  # To get SSL working, you will need to add the `https` key
  # to your endpoint configuration:
  #
  #     config :sqlete, SQLeteWeb.Endpoint,
  #       https: [
  #         ...,
  #         port: 443,
  #         cipher_suite: :strong,
  #         keyfile: System.get_env("SOME_APP_SSL_KEY_PATH"),
  #         certfile: System.get_env("SOME_APP_SSL_CERT_PATH")
  #       ]
  #
  # The `cipher_suite` is set to `:strong` to support only the
  # latest and more secure SSL ciphers. This means old browsers
  # and clients may not be supported. You can set it to
  # `:compatible` for wider support.
  #
  # `:keyfile` and `:certfile` expect an absolute path to the key
  # and cert in disk or a relative path inside priv, for example
  # "priv/ssl/server.key". For all supported SSL configuration
  # options, see https://hexdocs.pm/plug/Plug.SSL.html#configure/1
  #
  # We also recommend setting `force_ssl` in your config/prod.exs,
  # ensuring no data is ever sent via http, always redirecting to https:
  #
  #     config :sqlete, SQLeteWeb.Endpoint,
  #       force_ssl: [hsts: true]
  #
  # Check `Plug.SSL` for all available options in `force_ssl`.

  # ## Configuring the mailer
  #
  # In production you need to configure the mailer to use a different adapter.
  # Here is an example configuration for Mailgun:
  #
  #     config :sqlete, SQLete.Mailer,
  #       adapter: Swoosh.Adapters.Mailgun,
  #       api_key: System.get_env("MAILGUN_API_KEY"),
  #       domain: System.get_env("MAILGUN_DOMAIN")
  #
  # Most non-SMTP adapters require an API client. Swoosh supports Req, Hackney,
  # and Finch out-of-the-box. This configuration is typically done at
  # compile-time in your config/prod.exs:
  #
  #     config :swoosh, :api_client, Swoosh.ApiClient.Req
  #
  # See https://hexdocs.pm/swoosh/Swoosh.html#module-installation for details.
end
