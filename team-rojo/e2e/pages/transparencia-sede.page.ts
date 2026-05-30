import type { Page } from "@playwright/test";

export class TransparenciaSedePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async getBodyText(): Promise<string> {
    return this.page.locator("body").innerText();
  }

  async containsEntityName(entityName: string): Promise<boolean> {
    const text = await this.getBodyText();
    return text.toLowerCase().includes(entityName.toLowerCase());
  }

  async isSedePortal(): Promise<boolean> {
    const url = this.page.url();
    return url.includes("transparencia.sede.gob.es");
  }

  async hasProcedureParams(): Promise<{ idProc: string; idAmb: string } | null> {
    const url = new URL(this.page.url());
    const idProc = url.searchParams.get("idProc");
    const idAmb = url.searchParams.get("idAmb");
    if (idProc && idAmb) {
      return { idProc, idAmb };
    }
    return null;
  }

  async getFormTitle(): Promise<string> {
    return this.page.locator("h1, h2, h3").first().innerText();
  }
}
