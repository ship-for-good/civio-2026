defmodule SQLete.Documents.Document do
  @moduledoc """
  Normalized return type for accepted PDF ingestion requests.
  """

  @enforce_keys [:id, :filename, :content_type, :byte_size, :checksum, :status, :metadata]
  defstruct [:id, :filename, :content_type, :byte_size, :checksum, :status, :metadata]

  @type t :: %__MODULE__{
          id: Ecto.UUID.t(),
          filename: String.t(),
          content_type: String.t(),
          byte_size: non_neg_integer(),
          checksum: String.t(),
      status: :accepted | :uploaded | :queued | :processing | :completed | :failed,
          metadata: map()
        }
end
