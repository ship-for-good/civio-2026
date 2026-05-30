defmodule Mix.Tasks.Sqlete.IngestPdfs do
  @shortdoc "Ingests PDFs from a directory into the pipeline"

  @moduledoc """
  Ingests all PDF files from a given directory.

  ## Usage

      mix sqlete.ingest_pdfs PATH_TO_PDFS

  ## Examples

      mix sqlete.ingest_pdfs ../dataset-notificaciones/pdfs
  """

  use Mix.Task

  @requirements ["app.start"]

  @impl true
  def run(args) do
    case args do
      [dir] ->
        dir
        |> validate_directory()
        |> ingest_all()

      [] ->
        Mix.raise("Expected PATH_TO_PDFS argument, e.g.: mix sqlete.ingest_pdfs ./pdfs")

      _ ->
        Mix.raise("Expected a single PATH_TO_PDFS argument")
    end
  end

  defp validate_directory(dir) do
    cond do
      not File.dir?(dir) ->
        Mix.raise("Directory not found: #{dir}")

      pdf_files(dir) == [] ->
        Mix.raise("No PDF files found in: #{dir}")

      true ->
        dir
    end
  end

  defp ingest_all(dir) do
    files = pdf_files(dir)
    total = length(files)

    Mix.shell().info("Found #{total} PDF(s) in #{dir}")

    results =
      files
      |> Enum.with_index(1)
      |> Enum.map(fn {path, index} ->
        filename = Path.basename(path)

        Mix.shell().info("[#{index}/#{total}] Ingesting #{filename}...")

        case path |> File.read!() |> SQLete.Documents.ingest_pdf(%{filename: filename}) do
          {:ok, doc} ->
            Mix.shell().info("[#{index}/#{total}] Accepted #{doc.filename} (#{doc.id})")
            :ok

          {:error, reason} ->
            Mix.shell().error("[#{index}/#{total}] Failed #{filename}: #{inspect(reason)}")
            :error
        end
      end)

    ok_count = Enum.count(results, &(&1 == :ok))
    err_count = Enum.count(results, &(&1 == :error))

    Mix.shell().info("Done. #{ok_count} succeeded, #{err_count} failed out of #{total}.")
  end

  defp pdf_files(dir) do
    dir
    |> Path.join("*.pdf")
    |> Path.wildcard()
    |> Enum.sort()
  end
end
