# frozen_string_literal: true

require "test_helper"

class Resources::Services::ImportFromCrawlTest < ActiveSupport::TestCase
  TREE_FIXTURE = {
    "stats" => { "uniqueUrls" => 4 },
    "tree" => {
      "name" => "publicidad-activa",
      "children" => [
        {
          "name" => "por-materias",
          "children" => [
            {
              "name" => "altos-cargos",
              "children" => [
                { "name" => "retribuciones", "children" => [] }
              ]
            }
          ]
        }
      ]
    }
  }.freeze

  FIXTURE_WITH_ORGANISMS = TREE_FIXTURE.merge(
    "organisms" => [
      {
        "slug" => "mdef",
        "has_altos_cargos" => true,
        "altos_cargos" => {
          "curriculos" => {
            "url" => "https://transparencia.gob.es/servicios-buscador/buscar.htm?categoria=curriculos&ente=E00003301"
          }
        }
      }
    ]
  ).freeze

  setup do
    Resources::Models::Resource.delete_all
  end

  test "imports resources and writes index json" do
    result = Resources::Services::ImportFromCrawl.new(data: TREE_FIXTURE).call

    assert_equal 4, result.imported
    assert_equal 4, Resources::Models::Resource.count

    resource = Resources::Models::Resource.find_by(subtema: "retribuciones")
    assert_equal "altos-cargos", resource.materia
    assert_equal "vigente", resource.vigencia
    assert result.index_path.file?

    index = JSON.parse(result.index_path.read)
    assert_equal 4, index["stats"]["total"]
    assert_equal 4, index["resources"].size
  end

  test "imports organism altos cargos from buscador alongside tree urls" do
    result = Resources::Services::ImportFromCrawl.new(data: FIXTURE_WITH_ORGANISMS).call

    assert_equal 5, result.imported
    assert_equal 5, Resources::Models::Resource.count

    curriculos = Resources::Models::Resource.find_by(
      organismo_code: "mdef",
      materia: "altos-cargos",
      subtema: "curriculos"
    )
    assert curriculos.url.include?("servicios-buscador")
  end
end
