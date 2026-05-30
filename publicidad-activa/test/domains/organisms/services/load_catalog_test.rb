# frozen_string_literal: true

require "test_helper"

class Organisms::Services::LoadCatalogTest < ActiveSupport::TestCase
  CATALOG = {
    "mdef" => { "label" => "Ministerio de Defensa", "description" => "Defensa.", "icon" => "star" },
    "aepd" => { "label" => "Agencia Española de Protección de Datos" }
  }.freeze

  test "returns label from catalog" do
    catalog = Organisms::Services::LoadCatalog.new(CATALOG)

    assert_equal "Ministerio de Defensa", catalog.label("mdef")
    assert_equal "Agencia Española de Protección de Datos", catalog.label("aepd")
  end

  test "falls back to uppercase code when label is missing" do
    catalog = Organisms::Services::LoadCatalog.new(CATALOG)

    assert_equal "UNKNOWN", catalog.label("unknown")
  end

  test "featured returns only entries with icon" do
    catalog = Organisms::Services::LoadCatalog.new(CATALOG)
    featured = catalog.featured

    assert_equal 1, featured.size
    assert_equal "mdef", featured.first.code
    assert_equal "star", featured.first.icon
  end

  test "loads real catalog file" do
    catalog = Organisms::Services::LoadCatalog.call

    assert_equal "Ministerio de Defensa", catalog.label("mdef")
    assert catalog.featured.size >= 12
  end
end
