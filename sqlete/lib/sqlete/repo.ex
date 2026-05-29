defmodule SQLete.Repo do
  use Ecto.Repo,
    otp_app: :sqlete,
    adapter: Ecto.Adapters.Postgres
end
