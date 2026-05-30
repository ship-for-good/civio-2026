# frozen_string_literal: true

module Resources
  module Services
    class LoadIndex
      INDEX_JSON_PATH = Rails.root.join("data/publicidad-activa-index.json")
      ORGANISM_CODE_PATTERN = /\A[a-z]{2,5}\z/

      FeaturedOrganism = Struct.new(:code, :label, :description, :icon, :count, keyword_init: true)

      def self.call(path: INDEX_JSON_PATH)
        new(path: path).call
      end

      def initialize(path: INDEX_JSON_PATH)
        @path = Pathname(path)
      end

      def call
        data = load
        counts = organism_counts(data)

        Result.new(
          total: data.dig("stats", "total") || data["resources"].size,
          organism_counts: counts,
          featured_organisms: featured_organisms(data, counts)
        )
      end

      private

      Result = Struct.new(:total, :organism_counts, :featured_organisms, keyword_init: true)

      def load
        raise PublicidadActiva::CrawlDataLoader::Error, "Missing #{@path}" unless @path.file?

        JSON.parse(@path.read)
      end

      def organism_counts(data)
        data["resources"].each_with_object(Hash.new(0)) do |resource, counts|
          code = resource["organismoCode"]
          counts[code] += 1 if code.present?
        end
      end

      def featured_organisms(data, counts)
        catalog = Organisms::Services::LoadCatalog.call

        counts
          .select { |code, _| code.match?(ORGANISM_CODE_PATTERN) }
          .sort_by { |_, count| -count }
          .first(12)
          .map do |code, count|
            entry = catalog.entry(code)

            FeaturedOrganism.new(
              code: code,
              label: catalog.label(code),
              description: entry&.description.presence || materia_summary(data, code),
              icon: entry&.icon.presence || "building",
              count: count
            )
          end
      end

      def materia_summary(data, code)
        labels = data["resources"]
          .select { |resource| resource["organismoCode"] == code }
          .filter_map { |resource| resource["materiaLabel"] }
          .uniq
          .first(3)

        labels.join(", ").presence || "Recursos indexados en publicidad activa"
      end
    end
  end
end
