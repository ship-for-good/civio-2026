# frozen_string_literal: true

module Search
  module Services
    class SearchResources
      SUBTEMA_SYNONYMS = {
        "rpt" => "relaciones-puestos-trabajo"
      }.freeze

      STOP_WORDS = %w[a al de del y e en la el lo los las un una por con para que].freeze

      Result = Struct.new(:resources, :facets, :total, keyword_init: true)

      def self.call(**kwargs)
        new(**kwargs).call
      end

      def initialize(query: nil, materia: nil, subtema: nil, organismo_code: nil, vigencia: "vigente", tipo: nil)
        @query = query&.strip
        @materia = materia.presence
        @subtema = subtema.presence
        @organismo_code = organismo_code.presence
        @vigencia = vigencia.presence || "vigente"
        @tipo = tipo.presence
      end

      def call
        scope = base_scope
        scope = apply_filters(scope)
        scope = apply_text_search(scope) if @query.present?

        resources = scope.order(:materia, :subtema, :url).to_a

        Result.new(
          resources: resources,
          facets: build_facets(scope),
          total: resources.size
        )
      end

      private

      def base_scope
        Resources::Models::Resource.where.not(organismo_code: nil)
      end

      def apply_filters(scope)
        scope = scope.where(vigencia: @vigencia) unless @vigencia == "all"
        scope = scope.where(materia: @materia) if @materia
        scope = scope.where(subtema: @subtema) if @subtema
        scope = scope.where(organismo_code: @organismo_code) if @organismo_code
        scope = scope.where(tipo: @tipo) if @tipo
        scope
      end

      def apply_text_search(scope)
        searchable_terms.each do |term|
          clauses = term_variants(term).flat_map { |variant| match_clauses(variant) }
          scope = scope.where(clauses.join(" OR "))
        end
        scope
      end

      def searchable_terms
        @searchable_terms ||= @query.downcase.split(/\s+/).reject { |term| STOP_WORDS.include?(term) }
      end

      def term_variants(term)
        normalized = catalog.normalize_search_text(term)
        [ term, synonyms[normalized], *catalog.codes_for_search_term(term) ].compact.uniq
      end

      def match_clauses(variant)
        if known_organismo_code?(variant)
          return [ "organismo_code = #{ActiveRecord::Base.connection.quote(variant)}" ]
        end

        pattern = "%#{ActiveRecord::Base.sanitize_sql_like(variant)}%"
        quoted = ActiveRecord::Base.connection.quote(pattern)
        [ <<~SQL.squish ]
          (LOWER(url) LIKE #{quoted} OR
           LOWER(materia) LIKE #{quoted} OR
           LOWER(subtema) LIKE #{quoted} OR
           LOWER(materia_label) LIKE #{quoted} OR
           LOWER(subtema_label) LIKE #{quoted} OR
           LOWER(COALESCE(organismo_code, '')) LIKE #{quoted} OR
           LOWER(COALESCE(tipo, '')) LIKE #{quoted} OR
           LOWER(path_segments) LIKE #{quoted})
        SQL
      end

      def known_organismo_code?(variant)
        catalog.entry(variant).present?
      end

      def catalog
        @catalog ||= Organisms::Services::LoadCatalog.call
      end

      def synonyms
        @synonyms ||= catalog.alias_index.merge(SUBTEMA_SYNONYMS)
      end

      def build_facets(scope)
        {
          materia: facet_counts(scope, :materia),
          organismo_code: facet_counts(scope, :organismo_code)
        }
      end

      def facet_counts(scope, column)
        scope.where.not(column => nil)
             .group(column)
             .count
             .sort_by { |_, count| -count }
             .map { |name, count| { name: name, count: count } }
      end
    end
  end
end
