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
    @materias = Organisms::Services::BuildOrganismNavigation.materias_for(@code)
    @catalog_entry = catalog.entry(@code)
  end

  def materia
    catalog = Organisms::Services::LoadCatalog.call
    @code = params[:code]
    @materia = params[:materia]
    @label = catalog.label(@code)
    @materia_label = Resources::ValueObjects::Taxonomy.materia_label(@materia)
    @subtemas = Organisms::Services::BuildOrganismNavigation.subtemas_for(@code, @materia)

    head :not_found and return if @subtemas.empty?
  end

  def subtema
    catalog = Organisms::Services::LoadCatalog.call
    @code = params[:code]
    @materia = params[:materia]
    @subtema = params[:subtema]
    @label = catalog.label(@code)
    @materia_label = Resources::ValueObjects::Taxonomy.materia_label(@materia)
    @subtema_label = Resources::ValueObjects::Taxonomy.subtema_label(@subtema)

    result = Organisms::Services::BuildOrganismNavigation.resources_for(@code, @materia, @subtema)
    @vigente = result.vigente
    @historicos = result.historicos

    head :not_found and return if @vigente.nil? && @historicos.empty?
  end
end
