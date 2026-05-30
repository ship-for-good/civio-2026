# frozen_string_literal: true

module Organisms
  module Services
    class BuildOrganismNavigation
      META_MATERIAS = %w[por-materias publicidad-activa].freeze
      META_SUBTEMAS = %w[portada].freeze

      MateriaEntry = Struct.new(:slug, :label, :count, keyword_init: true)
      NavigationEntry = Struct.new(:materia, :subtemas, keyword_init: true)
      SubtemaEntry = Struct.new(
        :slug, :label, :count, :vigente_url, :historico_count, :has_historico,
        keyword_init: true
      )
      SubtemaResources = Struct.new(:vigente, :historicos, keyword_init: true)

      def self.materias_for(organismo_code)
        new(organismo_code).materias
      end

      def self.navigation_for(organismo_code)
        new(organismo_code).navigation
      end

      def self.subtemas_for(organismo_code, materia)
        new(organismo_code, materia: materia).subtemas
      end

      def self.resources_for(organismo_code, materia, subtema)
        new(organismo_code, materia: materia, subtema: subtema).resources
      end

      def initialize(organismo_code, materia: nil, subtema: nil)
        @organismo_code = organismo_code
        @materia = materia
        @subtema = subtema
      end

      def materias
        navigable_scope
          .group(:materia, :materia_label)
          .count
          .map do |(slug, label), count|
            MateriaEntry.new(slug: slug, label: label, count: count)
          end
          .sort_by(&:label)
      end

      def navigation
        materias.map do |materia|
          NavigationEntry.new(
            materia: materia,
            subtemas: self.class.subtemas_for(@organismo_code, materia.slug)
          )
        end
      end

      def subtemas
        return [] unless @materia

        scope = navigable_scope.where(materia: @materia)

        scope
          .group(:subtema, :subtema_label)
          .count
          .map do |(slug, label), count|
            subtema_scope = scope.where(subtema: slug)
            vigente = pick_vigente(subtema_scope)
            historico_count = subtema_scope.where(vigencia: "historico").count

            SubtemaEntry.new(
              slug: slug,
              label: label,
              count: count,
              vigente_url: vigente&.url,
              historico_count: historico_count,
              has_historico: historico_count.positive?
            )
          end
          .sort_by(&:label)
      end

      def resources
        return SubtemaResources.new(vigente: nil, historicos: []) unless @materia && @subtema

        scope = navigable_scope.where(materia: @materia, subtema: @subtema)
        return SubtemaResources.new(vigente: nil, historicos: []) if scope.none?

        SubtemaResources.new(
          vigente: pick_vigente(scope),
          historicos: scope
            .where(vigencia: "historico")
            .order(periodo: :desc, url: :desc)
            .to_a
        )
      end

      private

      def navigable_scope
        Resources::Models::Resource
          .by_organism(@organismo_code)
          .where.not(materia: META_MATERIAS)
          .where.not(subtema: META_SUBTEMAS)
      end

      # When multiple vigente rows exist, prefer the one with the latest periodo (lexicographic desc),
      # then the latest URL as a stable tiebreaker.
      def pick_vigente(scope)
        scope
          .where(vigencia: "vigente")
          .order(Arel.sql("periodo IS NULL"), periodo: :desc, url: :desc)
          .first
      end
    end
  end
end
