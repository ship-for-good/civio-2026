defmodule SQLete.Repo.Migrations.AddChannelToAlertCalls do
  use Ecto.Migration

  # Which channel the alert went out on: "sms" or "call". Existing rows were all
  # voice calls.
  def change do
    alter table(:alert_calls) do
      add :channel, :string, null: false, default: "call"
    end
  end
end
