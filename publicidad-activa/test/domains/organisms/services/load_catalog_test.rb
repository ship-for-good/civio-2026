# frozen_string_literal: true

require "test_helper"

class Organisms::Services::LoadCatalogTest < ActiveSupport::TestCase
  CATALOG = {
    "mdef" => {
      "label" => "Ministerio de Defensa",
      "description" => "Defensa.",
      "icon" => "star",
      "aliases" => [ "mdef", "defensa" ]
    },
    "aepd" => {
      "label" => "Agencia Española de Protección de Datos",
      "aliases" => [ "aepd", "protección" ]
    }
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

  test "builds alias index from catalog" do
    catalog = Organisms::Services::LoadCatalog.new(CATALOG)

    assert_equal "mdef", catalog.alias_index["defensa"]
    assert_equal "aepd", catalog.alias_index["protección"]
  end

  test "groups resource counts by label" do
    catalog = Organisms::Services::LoadCatalog.new(
      "mapama" => { "label" => "Ministerio de Agricultura", "aliases" => [ "mapama" ] },
      "magrama" => { "label" => "Ministerio de Agricultura", "aliases" => [ "magrama" ] },
      "mapa" => { "label" => "Agricultura y Pesca", "aliases" => [ "mapa" ] }
    )

    grouped = catalog.group_resource_counts("mapama" => 2, "magrama" => 4, "mapa" => 39)

    assert_equal 2, grouped.size
    agriculture = grouped.find { |g| g[:label] == "Ministerio de Agricultura" }
    assert_equal 6, agriculture[:count]
    assert_equal %w[magrama mapama], agriculture[:codes]
    assert_equal "magrama", agriculture[:code]
  end

  test "loads real catalog file" do
    catalog = Organisms::Services::LoadCatalog.call

    assert_equal "Ministerio de Defensa", catalog.label("mdef")
    assert catalog.featured.size >= 12
  end
end
