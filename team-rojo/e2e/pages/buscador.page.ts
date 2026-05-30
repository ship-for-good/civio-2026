import type { Locator, Page } from "@playwright/test";

export class BuscadorPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly submitButton: Locator;
  readonly resultCard: Locator;
  readonly resultLabel: Locator;
  readonly goToPortalButton: Locator;
  readonly explanation: Locator;
  readonly stepsList: Locator;
  readonly stepItems: Locator;
  readonly searchTip: Locator;
  readonly resetLink: Locator;
  readonly loadingIndicator: Locator;
  readonly queryChips: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", {
      name: /¿dónde está esa información pública/i,
    });
    this.searchInput = page.getByTestId("search-input");
    this.submitButton = page.getByTestId("search-submit");
    this.resultCard = page.getByTestId("result-card");
    this.resultLabel = page.getByTestId("result-label");
    this.goToPortalButton = page.getByRole("link", {
      name: /ir al portal/i,
    });
    this.explanation = page.locator("[data-testid='result-explanation']");
    this.stepsList = page.locator("[data-testid='step-guide']");
    this.stepItems = this.stepsList.locator("li");
    this.searchTip = page.locator("[data-testid='search-tip']");
    this.resetLink = page.getByRole("button", {
      name: /probar otra/i,
    });
    this.loadingIndicator = page.getByRole("status", {
      name: /clasificando/i,
    });
    this.queryChips = page.locator("[data-testid='query-chips']");
  }

  async goto(locale = "es"): Promise<void> {
    await this.page.goto(`/${locale}/buscador`, { waitUntil: "domcontentloaded" });
    await this.heading.waitFor({ state: "visible", timeout: 30_000 });
  }

  async search(query: string): Promise<void> {
    await this.searchInput.waitFor({ state: "visible", timeout: 15_000 });
    await this.searchInput.fill(query);
    await this.submitButton.click();
  }

  async waitForResult(): Promise<void> {
    await this.resultCard.waitFor({ state: "visible", timeout: 15_000 });
  }

  async getDeepLinkHref(): Promise<string | null> {
    return this.goToPortalButton.getAttribute("href");
  }

  async getDeepLinkTarget(): Promise<string | null> {
    return this.goToPortalButton.getAttribute("target");
  }

  async clickGoToPortal(): Promise<Page> {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.goToPortalButton.click(),
    ]);
    await newPage.waitForLoadState("domcontentloaded");
    return newPage;
  }

  async getStepsCount(): Promise<number> {
    return this.stepItems.count();
  }

  async reset(): Promise<void> {
    await this.resetLink.click();
  }
}
