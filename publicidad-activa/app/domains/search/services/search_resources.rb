# frozen_string_literal: true

module Search
  module Services
    class SearchResources
      SYNONYMS = {
        "defensa" => "mdef",
        "sanidad" => "msnd",
        "hacienda" => "mhac",
        "interior" => "mint",
        "justicia" => "mjui",
        "presidencia" => "pg",
        "rpt" => "relaciones-puestos-trabajo"
      }.freeze

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
        Resources::Models::Resource.all
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
        @query.downcase.split(/\s+/).each do |term|
          variants = [ term, SYNONYMS[term] ].compact.uniq
          clauses = variants.map do |variant|
            pattern = "%#{ActiveRecord::Base.sanitize_sql_like(variant)}%"
            <<~SQL.squish
              (LOWER(url) LIKE #{ActiveRecord::Base.connection.quote(pattern)} OR
               LOWER(materia) LIKE #{ActiveRecord::Base.connection.quote(pattern)} OR
               LOWER(subtema) LIKE #{ActiveRecord::Base.connection.quote(pattern)} OR
               LOWER(materia_label) LIKE #{ActiveRecord::Base.connection.quote(pattern)} OR
               LOWER(subtema_label) LIKE #{ActiveRecord::Base.connection.quote(pattern)} OR
               LOWER(COALESCE(organismo_code, '')) LIKE #{ActiveRecord::Base.connection.quote(pattern)} OR
               LOWER(COALESCE(tipo, '')) LIKE #{ActiveRecord::Base.connection.quote(pattern)} OR
               LOWER(path_segments) LIKE #{ActiveRecord::Base.connection.quote(pattern)})
            SQL
          end
          scope = scope.where(clauses.join(" OR "))
        end
        scope
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
