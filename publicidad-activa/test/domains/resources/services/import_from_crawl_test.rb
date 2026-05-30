# frozen_string_literal: true

require "test_helper"

class Resources::Services::ImportFromCrawlTest < ActiveSupport::TestCase
  FIXTURE = {
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

  setup do
    Resources::Models::Resource.delete_all
  end

  test "imports resources and writes index json" do
    result = Resources::Services::ImportFromCrawl.new(data: FIXTURE).call

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
end
