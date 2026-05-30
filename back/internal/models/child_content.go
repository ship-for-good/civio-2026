package models

// ChildContent summarizes a direct child node for parent indexing and UI context.
type ChildContent struct {
	Title       string `json:"title"`
	URL         string `json:"url"`
	PageType    string `json:"page_type"`
	ContentKind string `json:"content_kind"`
	Description string `json:"description,omitempty"`
}

func ContentKindLabel(pageType PageType) string {
	switch pageType {
	case PageTypeNavigation:
		return "índice de secciones"
	case PageTypeLeafStatic:
		return "contenido estático"
	case PageTypeLeafDynamic:
		return "datos interactivos"
	case PageTypeBuscadorEntry:
		return "buscador de registros"
	case PageTypeExternal:
		return "enlace externo"
	default:
		return string(pageType)
	}
}
