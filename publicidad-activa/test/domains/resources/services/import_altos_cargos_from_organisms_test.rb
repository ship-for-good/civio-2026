# frozen_string_literal: true

require "test_helper"

class Resources::Services::ImportAltosCargosFromOrganismsTest < ActiveSupport::TestCase
  ORGANISMS = [
    {
      "slug" => "mdef",
      "name" => "Ministerio de Defensa",
      "has_altos_cargos" => true,
      "altos_cargos" => {
        "curriculos" => {
          "count" => 98,
          "url" => "https://transparencia.gob.es/servicios-buscador/buscar.htm?categoria=curriculos&ente=E00003301",
          "source" => "buscador-results"
        },
        "retribuciones" => {
          "count" => 1036,
          "url" => "https://transparencia.gob.es/servicios-buscador/buscar.htm?categoria=retribuciones&ente=E00003301",
          "source" => "buscador-results"
        }
      }
    },
    {
      "slug" => "unknown",
      "has_altos_cargos" => false,
      "altos_cargos" => nil
    }
  ].freeze

  test "builds altos cargos resources per organism from buscador urls" do
    records = Resources::Services::ImportAltosCargosFromOrganisms.call(organisms: ORGANISMS)

    assert_equal 2, records.size

    curriculos = records.find { |record| record.subtema == "curriculos" }
    assert_equal "mdef", curriculos.organismo_code
    assert_equal "altos-cargos", curriculos.materia
    assert_equal "Altos cargos", curriculos.materia_label
    assert_equal "Currículos de altos cargos", curriculos.subtema_label
    assert_equal "vigente", curriculos.vigencia
    assert_includes curriculos.url, "servicios-buscador"
  end

  test "returns empty array when organisms is nil" do
    assert_empty Resources::Services::ImportAltosCargosFromOrganisms.call(organisms: nil)
  end
end
