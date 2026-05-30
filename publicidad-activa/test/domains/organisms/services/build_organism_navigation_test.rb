# frozen_string_literal: true

require "test_helper"

class Organisms::Services::BuildOrganismNavigationTest < ActiveSupport::TestCase
  setup do
    Resources::Models::Resource.delete_all

    create_resource!(
      id: "mdef-rpt-vigente",
      url: "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/relaciones-puestos-trabajo/rpt-mdef",
      materia: "organizacion-empleo",
      materia_label: "Organización y empleo",
      subtema: "relaciones-puestos-trabajo",
      subtema_label: "Relaciones de puestos de trabajo (RPT)",
      tipo: "rpt",
      organismo_code: "mdef",
      vigencia: "vigente"
    )

    create_resource!(
      id: "mdef-rpt-historico-1",
      url: "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/relaciones-puestos-trabajo/historico/rpt-enero-2026/rpt-mdef",
      materia: "organizacion-empleo",
      materia_label: "Organización y empleo",
      subtema: "relaciones-puestos-trabajo",
      subtema_label: "Relaciones de puestos de trabajo (RPT)",
      tipo: "rpt",
      organismo_code: "mdef",
      vigencia: "historico",
      periodo: "rpt-enero-2026"
    )

    create_resource!(
      id: "mdef-rpt-historico-2",
      url: "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/relaciones-puestos-trabajo/historico/rpt-junio-2020/rpt-mdef",
      materia: "organizacion-empleo",
      materia_label: "Organización y empleo",
      subtema: "relaciones-puestos-trabajo",
      subtema_label: "Relaciones de puestos de trabajo (RPT)",
      tipo: "rpt",
      organismo_code: "mdef",
      vigencia: "historico",
      periodo: "rpt-junio-2020"
    )

    create_resource!(
      id: "mdef-estructura-vigente",
      url: "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/estructura/estructura-mdef",
      materia: "organizacion-empleo",
      materia_label: "Organización y empleo",
      subtema: "estructura",
      subtema_label: "Estructura orgánica",
      tipo: "estructura",
      organismo_code: "mdef",
      vigencia: "vigente"
    )

    create_resource!(
      id: "mdef-meta-materia",
      url: "https://transparencia.gob.es/publicidad-activa/por-materias",
      materia: "por-materias",
      materia_label: "Por materias",
      subtema: "portada",
      subtema_label: "Portada",
      organismo_code: "mdef",
      vigencia: "vigente"
    )

    create_resource!(
      id: "mdef-portada",
      url: "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo",
      materia: "organizacion-empleo",
      materia_label: "Organización y empleo",
      subtema: "portada",
      subtema_label: "Portada",
      organismo_code: "mdef",
      vigencia: "vigente"
    )
  end

  test "materias_for groups resources by materia excluding meta entries" do
    materias = Organisms::Services::BuildOrganismNavigation.materias_for("mdef")

    assert_equal 1, materias.size
    assert_equal "organizacion-empleo", materias.first.slug
    assert_equal "Organización y empleo", materias.first.label
    assert_equal 4, materias.first.count
  end

  test "subtemas_for returns vigente url and historico count" do
    subtemas = Organisms::Services::BuildOrganismNavigation.subtemas_for("mdef", "organizacion-empleo")
    rpt = subtemas.find { |entry| entry.slug == "relaciones-puestos-trabajo" }

    assert_equal 3, rpt.count
    assert_equal "https://transparencia.gob.es/publicidad-activa/por-materias/organizacion-empleo/relaciones-puestos-trabajo/rpt-mdef", rpt.vigente_url
    assert_equal 2, rpt.historico_count
    assert rpt.has_historico
  end

  test "subtemas_for excludes portada" do
    subtemas = Organisms::Services::BuildOrganismNavigation.subtemas_for("mdef", "organizacion-empleo")

    refute subtemas.any? { |entry| entry.slug == "portada" }
  end

  test "resources_for splits vigente and historico" do
    result = Organisms::Services::BuildOrganismNavigation.resources_for(
      "mdef", "organizacion-empleo", "relaciones-puestos-trabajo"
    )

    assert_equal "mdef-rpt-vigente", result.vigente.id
    assert_equal 2, result.historicos.size
    assert_equal %w[rpt-enero-2026 rpt-junio-2020], result.historicos.map(&:periodo).sort
  end

  test "navigation_for groups subtemas under each materia" do
    navigation = Organisms::Services::BuildOrganismNavigation.navigation_for("mdef")

    assert_equal 1, navigation.size
    assert_equal "organizacion-empleo", navigation.first.materia.slug
    assert_equal 2, navigation.first.subtemas.size
    refute navigation.first.subtemas.any? { |entry| entry.slug == "portada" }
  end

  test "returns empty collections for unknown organism" do
    assert_empty Organisms::Services::BuildOrganismNavigation.materias_for("unknown")
    assert_empty Organisms::Services::BuildOrganismNavigation.subtemas_for("mdef", "unknown-materia")
  end

  private

  def create_resource!(attrs)
    defaults = {
      path_segments: %w[publicidad-activa por-materias],
      depth: 5
    }
    Resources::Models::Resource.create!(defaults.merge(attrs))
  end
end
