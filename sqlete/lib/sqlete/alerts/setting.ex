defmodule SQLete.Alerts.Setting do
  @moduledoc """
  Per-expediente alert preferences (keyed by `external_id`).

  Controls whether the deadline call is silenced, the destination phone (falls
  back to the global `ALERT_TO_NUMBER` when blank) and the day threshold that
  triggers the call.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "alert_settings" do
    field :external_id, :string
    field :phone, :string
    field :threshold_days, :integer, default: 5
    field :silenced, :boolean, default: false

    timestamps(type: :utc_datetime)
  end

  def changeset(setting, attrs) do
    setting
    |> cast(attrs, [:external_id, :phone, :threshold_days, :silenced])
    |> validate_required([:external_id])
    |> validate_number(:threshold_days, greater_than: 0)
    |> unique_constraint(:external_id)
  end
end
