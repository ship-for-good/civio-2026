defmodule SQLete.Alerts.Call do
  @moduledoc """
  A single placed (or attempted) deadline-alert call.

  `status` is the provider's initial call status (e.g. "queued") on success or
  `"failed"` on error. Tracking the final outcome (answered/no-answer) would
  require a provider status-callback webhook, which is intentionally out of scope
  for now.
  """
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "alert_calls" do
    field :external_id, :string
    field :channel, :string, default: "call"
    field :phone, :string
    field :dias_restantes, :integer
    field :fecha_limite, :date
    field :status, :string
    field :provider, :string
    field :provider_sid, :string
    field :error, :string

    timestamps(type: :utc_datetime)
  end

  def changeset(call, attrs) do
    call
    |> cast(attrs, [
      :external_id,
      :channel,
      :phone,
      :dias_restantes,
      :fecha_limite,
      :status,
      :provider,
      :provider_sid,
      :error
    ])
    |> validate_required([:external_id, :status])
  end
end
