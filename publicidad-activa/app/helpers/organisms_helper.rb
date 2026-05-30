# frozen_string_literal: true

module OrganismsHelper
  def organism_label(code)
    Organisms::Services::LoadCatalog.label(code)
  end
end
