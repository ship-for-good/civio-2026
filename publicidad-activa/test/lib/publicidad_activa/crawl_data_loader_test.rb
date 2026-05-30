# frozen_string_literal: true

require "test_helper"

class PublicidadActiva::CrawlDataLoaderTest < ActiveSupport::TestCase
  test "loads embedded DATA from crawl HTML" do
    data = PublicidadActiva::CrawlDataLoader.load

    assert_equal 1249, data.dig("stats", "uniqueUrls")
    assert_equal 6, data["materias"].size
    assert_equal "publicidad-activa", data.dig("tree", "name")
  end

  test "raises when HTML file is missing" do
    error = assert_raises(PublicidadActiva::CrawlDataLoader::Error) do
      PublicidadActiva::CrawlDataLoader.load("/tmp/nonexistent-crawl.html")
    end

    assert_match(/not found/, error.message)
  end
end
