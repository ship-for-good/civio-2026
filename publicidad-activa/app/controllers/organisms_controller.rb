# frozen_string_literal: true

class OrganismsController < ApplicationController
  def index
    catalog = Organisms::Services::LoadCatalog.call
    counts = Resources::Models::Resource
      .where.not(organismo_code: nil)
      .group(:organismo_code)
      .count

    @organisms = catalog.group_resource_counts(counts)
  end

  def show
    catalog = Organisms::Services::LoadCatalog.call
    @code = params[:code]
    @label = catalog.label(@code)
    @codes = catalog.codes_with_label(@label)
    @resources = Resources::Models::Resource
      .where(organismo_code: @codes)
      .order(:tipo, :subtema, :url)
  end
end
