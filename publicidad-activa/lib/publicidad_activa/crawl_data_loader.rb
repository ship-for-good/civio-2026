# frozen_string_literal: true

require "json"

module PublicidadActiva
  class CrawlDataLoader
    MARKER = "const DATA = "

    class Error < StandardError; end

    def self.default_html_path
      Rails.root.join("../docs/publicidad-activa-url-map.html").expand_path
    end

    def self.load(path = default_html_path)
      new(path).load
    end

    def initialize(path)
      @path = Pathname(path)
    end

    def load
      raise Error, "Crawl HTML not found: #{@path}" unless @path.file?

      data = JSON.parse(extract_json(@path.read))
      validate!(data)
      data
    end

    private

    def extract_json(html)
      start_index = html.index(MARKER)
      raise Error, "Could not find embedded DATA in #{@path}" unless start_index

      index = start_index + MARKER.length
      depth = 0
      in_string = false
      escape_next = false
      json_chars = +""

      while index < html.length
        char = html[index]
        json_chars << char

        if escape_next
          escape_next = false
        elsif char == "\\" && in_string
          escape_next = true
        elsif char == '"'
          in_string = !in_string
        elsif !in_string
          depth += 1 if char == "{"
          if char == "}"
            depth -= 1
            break if depth.zero?
          end
        end

        index += 1
      end

      raise Error, "Unbalanced JSON in DATA block" unless depth.zero?

      json_chars
    end

    def validate!(data)
      raise Error, "DATA missing stats.uniqueUrls" unless data.dig("stats", "uniqueUrls")
      raise Error, "DATA missing tree" unless data["tree"].is_a?(Hash)
    end
  end
end
