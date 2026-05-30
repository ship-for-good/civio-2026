defmodule SQLete.Inbox.Solicitud do
  @moduledoc """
  View-struct for a "solicitud de derecho de acceso" (access-right request).

  This is the read-side contract shared between the frontend (LiveViews) and the
  backend data source (`SQLete.Inbox.Source`). It carries the raw fields from the
  Civio data model (see PROYECTO-OPP2-DEFINICION §5) plus the computed deadline
  fields (§7), which are **always calculated server-side** so the frontend never
  computes legal deadlines itself.
  """

  @type semaforo :: :verde | :ambar | :rojo

  @type t :: %__MODULE__{
          # Raw fields (§5)
          id: Ecto.UUID.t() | String.t(),
          external_id: String.t(),
          ambito: String.t() | nil,
          fecha_solicitud: Date.t() | nil,
          asunto: String.t() | nil,
          organismo: String.t() | nil,
          inicio_tramitacion: Date.t() | nil,
          prorroga_20_1: Date.t() | nil,
          resolucion: Date.t() | nil,
          notificacion: Date.t() | nil,
          notas: String.t() | nil,
          autor: String.t() | nil,
          reclamacion_ref: String.t() | nil,
          parent_id: Ecto.UUID.t() | String.t() | nil,
          # Computed fields (§7), filled server-side
          estado: atom() | String.t(),
          vencimiento_efectivo: Date.t() | nil,
          fecha_limite_reclamacion_ctbg: Date.t() | nil,
          dias_para_reclamar: integer() | nil,
          dias_para_vencer: integer() | nil,
          semaforo: semaforo(),
          children_count: non_neg_integer(),
          # Optional associations (loaded on detail)
          notificaciones: [map()] | nil,
          children: [t()] | nil,
          parent: t() | nil
        }

  defstruct [
    :id,
    :external_id,
    :ambito,
    :fecha_solicitud,
    :asunto,
    :organismo,
    :inicio_tramitacion,
    :prorroga_20_1,
    :resolucion,
    :notificacion,
    :notas,
    :autor,
    :reclamacion_ref,
    :parent_id,
    :estado,
    :vencimiento_efectivo,
    :fecha_limite_reclamacion_ctbg,
    :dias_para_reclamar,
    :dias_para_vencer,
    semaforo: :verde,
    children_count: 0,
    notificaciones: nil,
    children: nil,
    parent: nil
  ]
end
