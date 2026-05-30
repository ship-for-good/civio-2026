# frozen_string_literal: true

module Organisms
  module Services
    class LoadCatalog
      CATALOG_PATH = Rails.root.join("data/organismos.json")

      Entry = Struct.new(:code, :label, :description, :icon, keyword_init: true)

      def self.call
        new
      end

      def self.label(code)
        call.label(code)
      end

      def initialize(data = nil)
        @data = data || JSON.parse(CATALOG_PATH.read)
      end

      def label(code)
        @data.dig(code.to_s, "label") || code.to_s.upcase
      end

      def entry(code)
        meta = @data[code.to_s]
        return nil unless meta

        Entry.new(
          code: code.to_s,
          label: meta["label"],
          description: meta["description"],
          icon: meta["icon"]
        )
      end

      def featured
        @data.filter_map do |code, meta|
          next unless meta["icon"].present?

          Entry.new(
            code: code,
            label: meta["label"],
            description: meta["description"],
            icon: meta["icon"]
          )
        end
      end
    end
  end
end
