# frozen_string_literal: true

class HomeController < ApplicationController
  def index
    @total_resources = Resources::Models::Resource.count
    @materia_counts = Resources::Models::Resource.group(:materia).count
  end
end
