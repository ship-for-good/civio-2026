# frozen_string_literal: true

module ResourcesHelper
  def resource_title(resource)
    parts = []
    parts << resource.page_label if resource.page_label.present?
    parts << resource.subtema_label
    parts << resource.materia_label
    parts.join(" · ")
  end
end
