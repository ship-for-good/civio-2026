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
    base = "inline-flex cursor-pointer items-center rounded-xl px-4 py-2.5 sm:px-5 sm:py-3 text-sm font-medium transition-colors"
    if active
      "#{base} bg-stone-900 text-white shadow-sm"
    else
      "#{base} border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900"
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
