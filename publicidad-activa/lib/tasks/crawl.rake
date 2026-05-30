# frozen_string_literal: true

namespace :crawl do
  desc "Extract embedded DATA from docs/publicidad-activa-url-map.html to data/crawl-data.json"
  task extract_data: :environment do
    data = PublicidadActiva::CrawlDataLoader.load
    output_path = Rails.root.join("data/crawl-data.json")
    output_path.dirname.mkpath
    output_path.write(JSON.pretty_generate(data))

    puts "Extracted crawl DATA to #{output_path}"
    puts "  uniqueUrls: #{data.dig('stats', 'uniqueUrls')}"
    puts "  materias: #{data['materias']&.size}"
  end
end
