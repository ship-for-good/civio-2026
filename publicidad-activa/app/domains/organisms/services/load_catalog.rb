# frozen_string_literal: true

module Organisms
  module Services
    class LoadCatalog
      CATALOG_PATH = Rails.root.join("data/organismos.json")

      Entry = Struct.new(:code, :label, :description, :icon, :aliases, keyword_init: true)

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

      def aliases(code)
        @data.dig(code.to_s, "aliases") || []
      end

      def alias_index
        @alias_index ||= @data.each_with_object({}) do |(code, meta), index|
          Array(meta["aliases"]).each do |term|
            index[term.to_s.downcase] = code.to_s
          end
        end
      end

      def codes_with_label(label)
        @data.each_with_object([]) do |(code, meta), codes|
          codes << code if self.label(code) == label
        end
      end

      def group_resource_counts(counts)
        counts
          .group_by { |code, _count| label(code) }
          .map do |label, pairs|
            sorted = pairs.sort_by { |code, count| [ -count, code ] }
            primary_code, = sorted.first

            {
              label: label,
              code: primary_code,
              codes: sorted.map(&:first),
              count: pairs.sum(&:last)
            }
          end
          .sort_by { |group| group[:label] }
      end

      def entry(code)
        meta = @data[code.to_s]
        return nil unless meta

        Entry.new(
          code: code.to_s,
          label: meta["label"],
          description: meta["description"],
          icon: meta["icon"],
          aliases: Array(meta["aliases"])
        )
      end

      def featured
        @data.filter_map do |code, meta|
          next unless meta["icon"].present?

          Entry.new(
            code: code,
            label: meta["label"],
            description: meta["description"],
            icon: meta["icon"],
            aliases: Array(meta["aliases"])
          )
        end
      end
    end
  end
end
