# frozen_string_literal: true

Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  root "home#index"

  get "explore", to: "explore#index"
  get "organisms", to: "organisms#index"
  get "organisms/:code", to: "organisms#show", as: :organism
  get "url-map", to: "url_maps#show"

  namespace :api do
    get "search", to: "search#index"
  end
end
