# frozen_string_literal: true

class UrlMapsController < ApplicationController
  MAP_PATH = Rails.root.join("../docs/publicidad-activa-url-map.html").expand_path

  def show
    if MAP_PATH.file?
      send_file MAP_PATH, disposition: "inline", type: "text/html"
    else
      render plain: "Mapa no disponible", status: :not_found
    end
  end
end
