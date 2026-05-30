# frozen_string_literal: true

module Resources
  module Services
    class FlattenCrawlTree
      BASE_URL = "https://transparencia.gob.es"

      FlatNode = Struct.new(:url, :path_segments, keyword_init: true)

      def self.call(tree:, expected_count: nil)
        new(tree: tree, expected_count: expected_count).call
      end

      def initialize(tree:, expected_count: nil)
        @tree = tree
        @expected_count = expected_count
      end

      def call
        @nodes = []
        walk(@tree, [])

        unique = @nodes.index_by(&:url).values

        if @expected_count && unique.size != @expected_count
          Rails.logger.warn(
            "[FlattenCrawlTree] Expected #{@expected_count} URLs, got #{unique.size}"
          )
        end

        unique.map do |node|
          ParseUrlPath.call(url: node.url, path_segments: node.path_segments)
        end
      end

      private

      def walk(node, segments)
        current_segments = node["name"] ? segments + [ node["name"] ] : segments

        if node["name"]
          url = "#{BASE_URL}/#{current_segments.join('/')}"
          @nodes << FlatNode.new(url: url, path_segments: current_segments)
        end

        (node["children"] || []).each do |child|
          walk(child, current_segments)
        end
      end
    end
  end
end
