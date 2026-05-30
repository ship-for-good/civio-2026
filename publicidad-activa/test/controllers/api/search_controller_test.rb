# frozen_string_literal: true

require "test_helper"

class Api::SearchControllerTest < ActionDispatch::IntegrationTest
  setup do
    Resources::Models::Resource.delete_all
    Resources::Models::Resource.create!(
      id: "test-resource",
      url: "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/relaciones-puestos-trabajo/rpt-mdef",
      materia: "organizacion-empleo",
      materia_label: "Organización y empleo",
      subtema: "relaciones-puestos-trabajo",
      subtema_label: "Relaciones de puestos de trabajo (RPT)",
      tipo: "rpt",
      organismo_code: "mdef",
      vigencia: "vigente",
      path_segments: %w[publicidad-activa por-materias organizacion-empleo relaciones-puestos-trabajo rpt-mdef],
      depth: 5
    )
  end

  test "returns json search results" do
    get api_search_path, params: { q: "defensa", vigencia: "all" }

    assert_response :success
    body = JSON.parse(response.body)
    assert body["total"].positive?
    assert_equal "mdef", body["resources"].first["organismoCode"]
  end
end
