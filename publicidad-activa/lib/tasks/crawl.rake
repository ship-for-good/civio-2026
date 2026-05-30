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

  desc "Import crawl tree into resources table and publicidad-activa-index.json"
  task import: :environment do
    json_path = Rails.root.join("data/crawl-data.json")
    unless json_path.file?
      puts "Missing #{json_path}, running extract_data first..."
      Rake::Task["crawl:extract_data"].invoke
    end

    result = Resources::Services::ImportFromCrawl.call
    puts "Imported #{result.imported} resources (expected #{result.expected})"
    puts "  index: #{result.index_path}"
    puts "  current: #{Resources::Models::Resource.current.count}"
    puts "  historical: #{Resources::Models::Resource.historical.count}"
  end
end
