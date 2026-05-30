# frozen_string_literal: true

module Resources
  module ValueObjects
    module Taxonomy
      MATERIA_LABELS = {
        "organizacion-empleo" => "Organización y empleo",
        "informacion-economico-presupuestaria" => "Información económico-presupuestaria",
        "altos-cargos" => "Altos cargos",
        "tramites" => "Contratos, convenios y subvenciones",
        "normativa-otras-disposiciones" => "Normativa y otras disposiciones",
        "planificacion-estadistica" => "Planificación y estadística",
        "por-materias" => "Por materias",
        "publicidad-activa" => "Publicidad activa"
      }.freeze

      SUBTEMA_LABELS = {
        "relaciones-puestos-trabajo" => "Relaciones de puestos de trabajo (RPT)",
        "estructura" => "Estructura orgánica",
        "funciones" => "Funciones",
        "normativa" => "Normativa de organización",
        "registro-actividades-tratamiento" => "RAT",
        "compatibilidad-empleados" => "Compatibilidades",
        "codigo-conducta" => "Código de conducta",
        "sector-publico-institucional" => "Sector público institucional",
        "presupuestos-generales-estado" => "Presupuestos generales del Estado",
        "cuentas-anuales-auditoria" => "Cuentas anuales e informes de auditoría",
        "bienes-inmuebles" => "Bienes inmuebles",
        "ejecucion" => "Ejecución presupuestaria",
        "estabilidad" => "Estabilidad presupuestaria",
        "informes-fiscalizacion" => "Informes de fiscalización",
        "rendicion-cuentas" => "Rendición de cuentas",
        "retribuciones" => "Retribuciones de altos cargos",
        "declaraciones-bienes-derechos" => "Declaraciones de bienes y derechos",
        "actividad-privada-cese" => "Actividad privada tras el cese",
        "indemnizaciones-abandono" => "Indemnizaciones por abandono del cargo",
        "curriculos" => "Currículos de altos cargos",
        "agendaAACC" => "Agenda de altos cargos",
        "principios" => "Principios de buen gobierno",
        "obligaciones-age" => "Obligaciones de los altos cargos",
        "contratos" => "Contratos",
        "subvenciones" => "Subvenciones",
        "acuerdos-marco" => "Contratos basados en acuerdos marco",
        "convenios-encomiendas" => "Convenios y encomiendas",
        "encargos-medios-propios" => "Encargos a medios propios",
        "subvenciones-partidos-politicos" => "Subvenciones a partidos políticos",
        "plan-anual" => "Plan anual normativo",
        "informacion-publica" => "Información pública",
        "normas-tramitacion" => "Normas en tramitación",
        "participacion-publica" => "Participación pública",
        "cartas-servicios" => "Cartas de servicios",
        "planes-programas" => "Planes y programas",
        "portada" => "Portada"
      }.freeze

      module_function

      def materia_label(slug)
        MATERIA_LABELS[slug] || humanize_slug(slug)
      end

      def subtema_label(slug)
        SUBTEMA_LABELS[slug] || humanize_slug(slug)
      end

      def humanize_slug(slug)
        slug.to_s.tr("-", " ").capitalize
      end
    end
  end
end
