# frozen_string_literal: true

require "test_helper"

class Resources::Services::ParseUrlPathTest < ActiveSupport::TestCase
  test "parses historic RPT Defensa" do
    url = "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/relaciones-puestos-trabajo/historico/rpt-enero-2026/rpt-mdef"
    segments = url.sub("https://transparencia.gob.es/", "").split("/")

    result = Resources::Services::ParseUrlPath.call(url: url, path_segments: segments)

    assert_equal "organizacion-empleo", result.materia
    assert_equal "relaciones-puestos-trabajo", result.subtema
    assert_equal "historico", result.vigencia
    assert_equal "rpt-enero-2026", result.periodo
    assert_equal "rpt", result.tipo
    assert_equal "mdef", result.organismo_code
    assert_equal "Organización y empleo", result.materia_label
  end

  test "parses vigente RPT at current level" do
    url = "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/relaciones-puestos-trabajo/rpt-mdef"
    segments = url.sub("https://transparencia.gob.es/", "").split("/")

    result = Resources::Services::ParseUrlPath.call(url: url, path_segments: segments)

    assert_equal "vigente", result.vigencia
    assert_nil result.periodo
    assert_equal "mdef", result.organismo_code
  end

  test "parses altos cargos without organismo" do
    url = "https://transparencia.gob.es/publicidad-activa/por-materias/altos-cargos/retribuciones"
    segments = url.sub("https://transparencia.gob.es/", "").split("/")

    result = Resources::Services::ParseUrlPath.call(url: url, path_segments: segments)

    assert_equal "altos-cargos", result.materia
    assert_equal "retribuciones", result.subtema
    assert_nil result.organismo_code
    assert_nil result.tipo
  end

  test "parses tramites contratos" do
    url = "https://transparencia.gob.es/publicidad-activa/por-materias/tramites/contratos"
    segments = url.sub("https://transparencia.gob.es/", "").split("/")

    result = Resources::Services::ParseUrlPath.call(url: url, path_segments: segments)

    assert_equal "tramites", result.materia
    assert_equal "contratos", result.subtema
    assert_equal "vigente", result.vigencia
  end

  test "handles edge slug without organismo code" do
    url = "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/normativa/normativa-mcnu.htmltiva-mcnu"
    segments = url.sub("https://transparencia.gob.es/", "").split("/")

    result = Resources::Services::ParseUrlPath.call(url: url, path_segments: segments)

    assert_nil result.organismo_code
    assert_nil result.tipo
  end

  test "generates stable canonical id from url" do
    url = "https://transparencia.gob.es/publicidad-activa"
    id = Resources::Services::ParseUrlPath.canonical_id(url)

    assert_equal 16, id.length
    assert_equal id, Resources::Services::ParseUrlPath.canonical_id(url)
  end
end
