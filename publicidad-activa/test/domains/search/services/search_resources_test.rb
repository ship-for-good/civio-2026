# frozen_string_literal: true

require "test_helper"

class Search::Services::SearchResourcesTest < ActiveSupport::TestCase
  setup do
    Resources::Models::Resource.delete_all
    Resources::Services::ImportFromCrawl.new(
      data: JSON.parse(file_fixture("crawl_mini.json").read)
    ).call

    Resources::Models::Resource.create!(
      id: "rpt-mdef-vigente",
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

    Resources::Models::Resource.create!(
      id: "rpt-mdef-historico",
      url: "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/relaciones-puestos-trabajo/historico/rpt-enero-2026/rpt-mdef",
      materia: "organizacion-empleo",
      materia_label: "Organización y empleo",
      subtema: "relaciones-puestos-trabajo",
      subtema_label: "Relaciones de puestos de trabajo (RPT)",
      tipo: "rpt",
      organismo_code: "mdef",
      vigencia: "historico",
      periodo: "rpt-enero-2026",
      path_segments: %w[publicidad-activa por-materias organizacion-empleo relaciones-puestos-trabajo historico rpt-enero-2026 rpt-mdef],
      depth: 7
    )

    Resources::Models::Resource.create!(
      id: "rpt-aepd-vigente",
      url: "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/relaciones-puestos-trabajo/rpt-aepd",
      materia: "organizacion-empleo",
      materia_label: "Organización y empleo",
      subtema: "relaciones-puestos-trabajo",
      subtema_label: "Relaciones de puestos de trabajo (RPT)",
      tipo: "rpt",
      organismo_code: "aepd",
      vigencia: "vigente",
      path_segments: %w[publicidad-activa por-materias organizacion-empleo relaciones-puestos-trabajo rpt-aepd],
      depth: 5
    )
  end

  test "defaults to vigente only" do
    result = Search::Services::SearchResources.call

    assert result.resources.all? { |r| r.vigencia == "vigente" }
    refute result.resources.any? { |r| r.id == "rpt-mdef-historico" }
  end

  test "searches defensa rpt with synonyms" do
    result = Search::Services::SearchResources.call(query: "Defensa RPT", vigencia: "all")

    ids = result.resources.map(&:id)
    assert_includes ids, "rpt-mdef-vigente"
    assert_includes ids, "rpt-mdef-historico"
  end

  test "searches organism alias from catalog" do
    result = Search::Services::SearchResources.call(query: "protección", vigencia: "all")

    assert result.resources.any? { |r| r.organismo_code == "aepd" }
  end

  test "filters by materia" do
    result = Search::Services::SearchResources.call(materia: "altos-cargos", vigencia: "all")

    assert result.resources.all? { |r| r.materia == "altos-cargos" }
    assert result.total.positive?
  end

  test "returns facets" do
    result = Search::Services::SearchResources.call(vigencia: "all")

    assert result.facets.key?(:materia)
    assert result.facets.key?(:organismo_code)
    assert result.facets[:materia].any? { |f| f[:name] == "organizacion-empleo" }
  end
end
