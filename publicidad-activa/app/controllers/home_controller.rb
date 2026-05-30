# frozen_string_literal: true

class HomeController < ApplicationController
  ORGANISMOS_PATH = Rails.root.join("data/organismos.json")

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
    catalog = JSON.parse(File.read(ORGANISMOS_PATH))

    catalog.map do |code, meta|
      {
        code: code,
        label: meta["label"],
        description: meta["description"],
        icon: meta["icon"],
        count: @organism_counts[code] || 0
      }
    end
  end
end
