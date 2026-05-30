# frozen_string_literal: true

class OrganismsController < ApplicationController
  def index
    catalog = Organisms::Services::LoadCatalog.call
    counts = Resources::Models::Resource
      .where.not(organismo_code: nil)
      .group(:organismo_code)
      .count

    @organisms = counts.map do |code, count|
      { code: code, label: catalog.label(code), count: count }
    end.sort_by { |organism| organism[:label] }
  end

  def show
    @code = params[:code]
    @label = Organisms::Services::LoadCatalog.label(@code)
    @resources = Resources::Models::Resource.by_organism(@code).order(:tipo, :subtema, :url)
  end
end
