# frozen_string_literal: true

class HomeController < ApplicationController
  def index
    @total_resources = Resources::Models::Resource.count
    @organism_counts = Resources::Models::Resource
      .where.not(organismo_code: nil)
      .group(:organismo_code)
      .count
    @featured_organisms = featured_organisms
  end

  private

  def featured_organisms
    Organisms::Services::LoadCatalog.call.featured.map do |entry|
      {
        code: entry.code,
        label: entry.label,
        description: entry.description,
        icon: entry.icon,
        count: @organism_counts[entry.code] || 0
      }
    end
  end
end
