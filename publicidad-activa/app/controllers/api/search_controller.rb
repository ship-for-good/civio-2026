# frozen_string_literal: true

module Api
  class SearchController < ApplicationController
    def index
      result = Search::Services::SearchResources.call(
        query: params[:q],
        materia: params[:materia],
        subtema: params[:subtema],
        organismo_code: params[:organismo],
        vigencia: params[:vigencia],
        tipo: params[:tipo]
      )

      render json: {
        total: result.total,
        facets: result.facets,
        resources: result.resources.map { |resource| serialize(resource) }
      }
    end

    private

    def serialize(resource)
      {
        id: resource.id,
        url: resource.url,
        materia: resource.materia,
        materiaLabel: resource.materia_label,
        subtema: resource.subtema,
        subtemaLabel: resource.subtema_label,
        tipo: resource.tipo,
        organismoCode: resource.organismo_code,
        vigencia: resource.vigencia,
        periodo: resource.periodo
      }
    end
  end
end
