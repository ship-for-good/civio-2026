# frozen_string_literal: true

module OrganismsHelper
  ORGANISM_MAIN_CLASS = "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14 w-full"
  ORGANISM_INDEX_MAIN_CLASS = "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 w-full"

  def organism_label(code)
    Organisms::Services::LoadCatalog.label(code)
  end

  def organism_resource_count(count)
    count == 1 ? "1 recurso" : "#{number_with_delimiter(count)} recursos"
  end

  def organism_code_badge(codes, code)
    codes.size > 1 ? codes.map(&:upcase).join(" · ") : code.upcase
  end

  def organism_from_home?
    params[:from] == "home"
  end

  def organism_nav_scope_params
    organism_from_home? ? { from: "home" } : {}
  end

  def organisms_index_path
    organism_from_home? ? root_path : organisms_path
  end

  def organisms_index_label
    organism_from_home? ? "Inicio" : "Organismos"
  end

  def organism_show_back_label
    organism_from_home? ? "Inicio" : "Todos los organismos"
  end

  def organism_breadcrumb_chevron
    tag.svg(
      class: "size-3.5 shrink-0",
      fill: "none",
      viewBox: "0 0 24 24",
      stroke: "currentColor",
      stroke_width: "1.5",
      "aria-hidden": "true"
    ) do
      tag.path("stroke-linecap": "round", "stroke-linejoin": "round", d: "m8.25 4.5 7.5 7.5-7.5 7.5")
    end
  end

  def organism_materia_tab_classes(active)
    base = "shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
    if active
      "#{base} bg-stone-900 text-white shadow-sm"
    else
      "#{base} text-stone-600 hover:bg-stone-50 hover:text-stone-900"
    end
  end

  def organism_stat_badge
    "inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
  end

  def organism_action_vigente(url)
    link_to url,
      target: "_blank",
      rel: "noopener",
      class: "inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-sky-700 transition-colors" do
      safe_join(["Versión vigente", organism_external_icon])
    end
  end

  def organism_action_historico(path)
    link_to path,
      class: "inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-50 transition-colors" do
      safe_join(["Ver histórico", organism_breadcrumb_chevron])
    end
  end

  def organism_card_link_classes
    "group flex flex-col h-full rounded-xl border border-stone-200 bg-white p-6 " \
      "shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200"
  end

  def organism_btn_primary(extra = nil)
    [
      "inline-flex items-center justify-center gap-2",
      "rounded-lg bg-sky-600 px-4 py-2",
      "text-sm font-medium text-white",
      "hover:bg-sky-700 active:bg-sky-800 transition-colors",
      extra
    ].compact.join(" ")
  end

  def organism_btn_secondary(extra = nil)
    [
      "inline-flex items-center justify-center gap-2",
      "rounded-lg border border-stone-200 bg-white px-4 py-2",
      "text-sm font-medium text-stone-700",
      "hover:border-stone-300 hover:bg-stone-50 active:bg-stone-100 transition-colors",
      extra
    ].compact.join(" ")
  end

  def organism_external_link(url, label: "Abrir en transparencia.gob.es", **options)
    css = options.delete(:class) || organism_btn_primary

    link_to url, target: "_blank", rel: "noopener", class: css, **options do
      safe_join([
        tag.span(label, class: "truncate"),
        organism_external_icon
      ])
    end
  end

  def organism_external_icon
    tag.svg(class: "size-3.5 shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", stroke_width: "1.5", "aria-hidden": "true") do
      tag.path("stroke-linecap": "round", "stroke-linejoin": "round", d: "M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25")
    end
  end

  def organism_back_link(path, label)
    link_to path, class: "inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-sky-700 transition-colors py-1" do
      safe_join([
        tag.svg(class: "size-4 shrink-0", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", stroke_width: "1.5", "aria-hidden": "true") do
          tag.path("stroke-linecap": "round", "stroke-linejoin": "round", d: "M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18")
        end,
        tag.span(label, class: "truncate")
      ])
    end
  end
end
