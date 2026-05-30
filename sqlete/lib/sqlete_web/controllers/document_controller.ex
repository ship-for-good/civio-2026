defmodule SQLeteWeb.DocumentController do
  @moduledoc """
  Serves the original PDF for a document so it can be viewed inline
  (embedded in an iframe or opened in a new browser tab).
  """
  use SQLeteWeb, :controller

  alias SQLete.Documents.DocumentFile
  alias SQLete.Repo

  def pdf(conn, %{"id" => id}) do
    with %DocumentFile{} = doc <- Repo.get(DocumentFile, id),
         {:ok, bytes} <- storage().get(doc.storage_key) do
      conn
      |> put_resp_content_type(doc.content_type || "application/pdf")
      |> put_resp_header("content-disposition", ~s(inline; filename="#{doc.filename}"))
      |> send_resp(200, bytes)
    else
      _ ->
        conn
        |> put_status(:not_found)
        |> text("PDF no disponible")
    end
  end

  defp storage do
    Application.get_env(:sqlete, :storage_module, SQLete.Storage.S3)
  end
end
