package crawler

import (
	"bytes"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/civio/civio-2026/internal/models"
	"github.com/civio/civio-2026/internal/parser"
)

func ClassifyPage(html []byte, pageURL string, childCount int) models.PageType {
	if parser.IsExternalURL(pageURL) && !parser.IsSedeURL(pageURL) {
		return models.PageTypeExternal
	}

	if childCount > 0 {
		return models.PageTypeNavigation
	}

	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(html))
	if err != nil {
		return models.PageTypeLeafStatic
	}

	main := doc.Find("main").First()
	if main.Length() == 0 {
		main = doc.Find(".dnt-main-content, .container").First()
	}

	mainHTML, _ := main.Html()
	lowerMain := strings.ToLower(mainHTML)

	if strings.Contains(lowerMain, "servicios-buscador") ||
		strings.Contains(lowerMain, "buscar.htm") ||
		main.Find("iframe[src*='buscador'], iframe[src*='buscar.htm']").Length() > 0 {
		return models.PageTypeBuscadorEntry
	}

	mainText := strings.TrimSpace(main.Text())
	if strings.Contains(strings.ToLower(mainText), "cargando") ||
		strings.Contains(lowerMain, "data-react") ||
		strings.Contains(lowerMain, "ng-app") ||
		(len(mainText) < 80 && strings.Contains(lowerMain, "<script")) {
		return models.PageTypeLeafDynamic
	}

	return models.PageTypeLeafStatic
}
