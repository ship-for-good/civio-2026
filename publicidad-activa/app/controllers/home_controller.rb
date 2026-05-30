# frozen_string_literal: true

class HomeController < ApplicationController
  def index
    index = Resources::Services::LoadIndex.call

    @total_resources = index.total
    @organism_counts = index.organism_counts
    @featured_organisms = index.featured_organisms
  end
end
