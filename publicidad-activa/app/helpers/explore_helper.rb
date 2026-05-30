# frozen_string_literal: true

module ExploreHelper
  EXPLORE_MAIN_CLASS = OrganismsHelper::ORGANISM_INDEX_MAIN_CLASS

  VIGENCIA_OPTIONS = [
    [ "Vigentes", "vigente" ],
    [ "No vigentes", "historico" ],
    [ "Todos", "all" ]
  ].freeze

  def explore_vigencia_value
    params[:vigencia].presence || "vigente"
  end

  def explore_vigencia_label(vigencia)
    vigencia == "historico" ? "No vigente" : "Vigente"
  end

  def explore_vigencia_pill_classes(active)
    base = "inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors"
    if active
      "#{base} bg-stone-900 text-white"
    else
      "#{base} text-stone-600 hover:bg-stone-100 hover:text-stone-900"
    end
  end

  def explore_search_active?
    params[:q].present? ||
      params[:organismo].present? ||
      params[:materia].present? ||
      params[:subtema].present? ||
      params[:tipo].present? ||
      explore_vigencia_value != "vigente"
  end

  def explore_filter_params
    params.permit(:q, :vigencia, :organismo, :materia, :subtema, :tipo).to_h.compact_blank
  end
end
