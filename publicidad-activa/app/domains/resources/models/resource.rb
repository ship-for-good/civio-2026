# frozen_string_literal: true

module Resources
  module Models
    class Resource < ApplicationRecord
      self.table_name = "resources"

      VIGENCIAS = %w[vigente historico].freeze

      validates :id, presence: true
      validates :url, presence: true, uniqueness: true
      validates :materia, :materia_label, :subtema, :subtema_label, presence: true
      validates :vigencia, inclusion: { in: VIGENCIAS }
      validates :depth, numericality: { only_integer: true, greater_than: 0 }
      validates :path_segments, presence: true

      scope :vigentes, -> { where(vigencia: "vigente") }
      scope :historicos, -> { where(vigencia: "historico") }
      scope :by_materia, ->(materia) { where(materia: materia) }
      scope :by_subtema, ->(subtema) { where(subtema: subtema) }
      scope :by_organismo, ->(code) { where(organismo_code: code) }

      def historico?
        vigencia == "historico"
      end
    end
  end
end
