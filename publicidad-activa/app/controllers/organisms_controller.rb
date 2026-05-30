# frozen_string_literal: true

class OrganismsController < ApplicationController
  def index
    @organisms = Resources::Models::Resource
      .where.not(organismo_code: nil)
      .group(:organismo_code)
      .order(:organismo_code)
      .count
  end

  def show
    @code = params[:code]
    @resources = Resources::Models::Resource.by_organism(@code).order(:tipo, :subtema, :url)
  end
end
