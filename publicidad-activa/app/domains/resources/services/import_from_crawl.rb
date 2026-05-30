# frozen_string_literal: true

module Resources
  module Services
    class ImportFromCrawl
      Result = Struct.new(:imported, :expected, :index_path, keyword_init: true)

      DEFAULT_JSON_PATH = Rails.root.join("data/crawl-data.json")
      INDEX_JSON_PATH = Rails.root.join("data/publicidad-activa-index.json")

      def self.call(source_path: DEFAULT_JSON_PATH)
        new(source_path: source_path).call
      end

      def initialize(source_path: DEFAULT_JSON_PATH, data: nil)
        @source_path = Pathname(source_path)
        @data = data
      end

      def call
        crawl_data = @data || load_crawl_data
        expected = crawl_data.dig("stats", "uniqueUrls")
        parsed = FlattenCrawlTree.call(tree: crawl_data["tree"], expected_count: expected)

        Resources::Models::Resource.transaction do
          Resources::Models::Resource.delete_all
          insert_resources(parsed)
        end

        index_path = write_index_json(parsed, expected)

        Result.new(imported: parsed.size, expected: expected, index_path: index_path)
      end

      private

      def load_crawl_data
        raise PublicidadActiva::CrawlDataLoader::Error, "Missing #{@source_path}" unless @source_path.file?

        JSON.parse(@source_path.read)
      end

      def insert_resources(parsed)
        rows = parsed.map { |record| resource_attributes(record) }
        rows.each_slice(500) do |batch|
          Resources::Models::Resource.insert_all!(batch)
        end
      end

      def resource_attributes(record)
        now = Time.current
        {
          id: record.id,
          url: record.url,
          materia: record.materia,
          materia_label: record.materia_label,
          subtema: record.subtema,
          subtema_label: record.subtema_label,
          tipo: record.tipo,
          organismo_code: record.organismo_code,
          vigencia: record.vigencia,
          periodo: record.periodo,
          path_segments: record.path_segments,
          depth: record.depth,
          created_at: now,
          updated_at: now
        }
      end

      def write_index_json(parsed, expected)
        materia_counts = parsed.group_by(&:materia).transform_values(&:size)

        payload = {
          generatedAt: Time.current.iso8601,
          stats: {
            total: parsed.size,
            expected: expected,
            materias: materia_counts.map { |name, count| { name: name, count: count } }
          },
          resources: parsed.map { |r| index_resource(r) }
        }

        INDEX_JSON_PATH.dirname.mkpath
        INDEX_JSON_PATH.write(JSON.pretty_generate(payload))
        INDEX_JSON_PATH
      end

      def index_resource(record)
        {
          id: record.id,
          url: record.url,
          materia: record.materia,
          materiaLabel: record.materia_label,
          subtema: record.subtema,
          subtemaLabel: record.subtema_label,
          tipo: record.tipo,
          organismoCode: record.organismo_code,
          vigencia: record.vigencia,
          periodo: record.periodo,
          pathSegments: record.path_segments,
          depth: record.depth
        }
      end
    end
  end
end
