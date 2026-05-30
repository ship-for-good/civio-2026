defmodule SQLete.Storage.Fake do
  @moduledoc """
  In-memory fake storage for use in tests.
  """

  @behaviour SQLete.Storage

  use GenServer

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def reset do
    case Process.whereis(__MODULE__) do
      nil ->
        :ok

      _pid ->
        try do
          GenServer.call(__MODULE__, :reset)
        catch
          :exit, {:noproc, _details} -> :ok
        end
    end
  end

  @impl true
  def store(bytes, opts \\ []) when is_binary(bytes) do
    ensure_started()

    filename = Keyword.get(opts, :filename, "upload")
    ext = Path.extname(filename)
    root = Path.rootname(filename)
    key = "test/#{root}-#{Ecto.UUID.generate()}#{ext}"

    GenServer.call(__MODULE__, {:store, key, bytes})
    {:ok, key}
  end

  @impl true
  def get(key) do
    ensure_started()

    case GenServer.call(__MODULE__, {:get, key}) do
      {:ok, bytes} -> {:ok, bytes}
      :error -> {:error, :not_found}
    end
  end

  @impl true
  def delete(key) do
    ensure_started()
    GenServer.call(__MODULE__, {:delete, key})
    :ok
  end

  @impl true
  def init(state), do: {:ok, state}

  @impl true
  def handle_call({:store, key, bytes}, _from, state) do
    {:reply, :ok, Map.put(state, key, bytes)}
  end

  def handle_call({:get, key}, _from, state) do
    {:reply, Map.fetch(state, key), state}
  end

  def handle_call({:delete, key}, _from, state) do
    {:reply, :ok, Map.delete(state, key)}
  end

  def handle_call(:reset, _from, _state) do
    {:reply, :ok, %{}}
  end

  defp ensure_started do
    case Process.whereis(__MODULE__) do
      nil ->
        case GenServer.start_link(__MODULE__, %{}, name: __MODULE__) do
          {:ok, _pid} -> :ok
          {:error, {:already_started, _pid}} -> :ok
        end

      _pid ->
        :ok
    end
  end
end
