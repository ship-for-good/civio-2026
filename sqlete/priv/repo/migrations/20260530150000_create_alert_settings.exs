defmodule SQLete.Repo.Migrations.CreateAlertSettings do
  use Ecto.Migration

  # Per-expediente alert preferences for the deadline call notifications.
  # Keyed by external_id (the stable expediente reference) so it survives
  # document re-ingestion. `phone` is optional: when blank the global
  # ALERT_TO_NUMBER is used. `silenced` powers the mute toggle on /alertas.
  def change do
    create table(:alert_settings, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :external_id, :string, null: false
      add :phone, :string
      add :threshold_days, :integer, null: false, default: 5
      add :silenced, :boolean, null: false, default: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:alert_settings, [:external_id])
  end
end
