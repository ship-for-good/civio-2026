# frozen_string_literal: true

class ExploreController < ApplicationController
  def index
    @result = Search::Services::SearchResources.call(
      query: params[:q],
      materia: params[:materia],
      subtema: params[:subtema],
      organismo_code: params[:organismo],
      vigencia: params[:vigencia],
      tipo: params[:tipo]
    )
  end
end
