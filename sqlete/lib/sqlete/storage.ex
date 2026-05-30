defmodule SQLete.Storage do
  @moduledoc """
  Behaviour for object storage backends.

  Implementations store and retrieve raw byte payloads from a
  blob/object store and return a stable storage key.
  """

  @doc """
  Store raw bytes and return a stable storage key.
  """
  @callback store(binary(), keyword()) :: {:ok, String.t()} | {:error, term()}

  @doc """
  Retrieve raw bytes for the given storage key.
  """
  @callback get(String.t()) :: {:ok, binary()} | {:error, term()}

  @doc """
  Delete the object identified by storage key.
  """
  @callback delete(String.t()) :: :ok | {:error, term()}
end
