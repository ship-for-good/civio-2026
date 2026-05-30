# frozen_string_literal: true

module Resources
  module Services
    class ImportAltosCargosFromOrganisms
      MATERIA = "altos-cargos"

      def self.call(organisms:)
        new(organisms: organisms).call
      end

      def initialize(organisms:)
        @organisms = organisms
      end

      def call
        Array(@organisms).flat_map { |organism| resources_for(organism) }
      end

      private

      def resources_for(organism)
        return [] unless organism["has_altos_cargos"]
        return [] unless organism["altos_cargos"].is_a?(Hash)

        slug = organism["slug"].to_s
        return [] if slug.blank?

        organism["altos_cargos"].filter_map do |subtema, meta|
          next unless meta.is_a?(Hash) && meta["url"].present?

          build_record(slug: slug, subtema: subtema.to_s, url: meta["url"])
        end
      end

      def build_record(slug:, subtema:, url:)
        ParseUrlPath::ParsedPath.new(
          id: ParseUrlPath.canonical_id(url),
          url: url,
          materia: MATERIA,
          materia_label: ValueObjects::Taxonomy.materia_label(MATERIA),
          subtema: subtema,
          subtema_label: ValueObjects::Taxonomy.subtema_label(subtema),
          tipo: nil,
          organismo_code: slug,
          vigencia: "vigente",
          periodo: nil,
          path_segments: [
            "publicidad-activa",
            "por-materias",
            MATERIA,
            subtema,
            slug
          ],
          depth: 5
        )
      end
    end
  end
end
