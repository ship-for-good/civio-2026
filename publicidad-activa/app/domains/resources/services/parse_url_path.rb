# frozen_string_literal: true

require "digest"

module Resources
  module Services
    class ParseUrlPath
      BASE_URL = "https://transparencia.gob.es"
      ORGANISMO_SLUG_PATTERN = /\A(rpt|estructura|funciones|normativa|rat)-(.+)\z/

      ParsedPath = Struct.new(
        :id,
        :url,
        :materia,
        :materia_label,
        :subtema,
        :subtema_label,
        :tipo,
        :organismo_code,
        :vigencia,
        :periodo,
        :path_segments,
        :depth,
        keyword_init: true
      )

      def self.call(url:, path_segments:)
        new(url: url, path_segments: path_segments).call
      end

      def initialize(url:, path_segments:)
        @url = url
        @segments = path_segments.map(&:to_s)
      end

      def call
        materia, subtema = extract_materia_subtema
        last_segment = @segments.last
        tipo, organismo_code = extract_tipo_organismo(last_segment)
        vigencia = @segments.include?("historico") ? "historico" : "vigente"
        periodo = extract_periodo(last_segment, organismo_code)

        ParsedPath.new(
          id: canonical_id(@url),
          url: @url,
          materia: materia,
          materia_label: ValueObjects::Taxonomy.materia_label(materia),
          subtema: subtema,
          subtema_label: ValueObjects::Taxonomy.subtema_label(subtema),
          tipo: tipo,
          organismo_code: organismo_code,
          vigencia: vigencia,
          periodo: periodo,
          path_segments: @segments,
          depth: @segments.size
        )
      end

      def self.canonical_id(url)
        Digest::SHA256.hexdigest(url)[0, 16]
      end

      private

      def extract_materia_subtema
        materias_idx = @segments.index("por-materias")
        if materias_idx
          materia = @segments[materias_idx + 1] || "por-materias"
          subtema = @segments[materias_idx + 2] || "portada"
          return [ materia, subtema ]
        end

        if @segments == [ "publicidad-activa" ]
          return [ "publicidad-activa", "portada" ]
        end

        materia = @segments[1] || @segments.first || "publicidad-activa"
        subtema = @segments[2] || "portada"
        [ materia, subtema ]
      end

      def extract_tipo_organismo(segment)
        match = segment&.match(ORGANISMO_SLUG_PATTERN)
        return [ nil, nil ] unless match

        code = match[2]
        return [ nil, nil ] if code.include?(".") || code.include?("html")

        [ match[1], code ]
      end

      def extract_periodo(last_segment, organismo_code)
        return nil unless organismo_code

        idx = @segments.rindex(last_segment)
        return nil unless idx&.positive?

        candidate = @segments[idx - 1]
        return nil if candidate.nil? || candidate == "historico"
        return nil unless period_segment?(candidate)

        candidate
      end

      def period_segment?(segment)
        segment.match?(/\A(rpt-|rpt--|xii|xiii|xiv|xi|x-legislatura|ejercicio-)/i) ||
          segment.match?(/legislatura/i) ||
          segment.match?(/\A\d{4}\z/)
      end

      def canonical_id(url)
        self.class.canonical_id(url)
      end
    end
  end
end
