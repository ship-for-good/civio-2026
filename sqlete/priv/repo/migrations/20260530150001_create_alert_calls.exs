defmodule SQLete.Repo.Migrations.CreateAlertCalls do
  use Ecto.Migration

  # History of placed deadline-alert calls (one row per attempt). `status` holds
  # the provider's initial call status ("queued"/...) or "failed" on error.
  # `fecha_limite` + `external_id` are used to dedupe so an expediente is only
  # called once per claim deadline window.
  def change do
    create table(:alert_calls, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :external_id, :string, null: false
      add :phone, :string
      add :dias_restantes, :integer
      add :fecha_limite, :date
      add :status, :string, null: false
      add :provider, :string
      add :provider_sid, :string
      add :error, :string

      timestamps(type: :utc_datetime)
    end

    create index(:alert_calls, [:external_id])
    create index(:alert_calls, [:external_id, :fecha_limite])
  end
end
