import { test, expect } from "@playwright/test";
import { BuscadorPage } from "../pages/buscador.page";
import { TransparenciaSedePage } from "../pages/transparencia-sede.page";
import {
  mockClassifyApi,
  createMockClassification,
  HACIENDA_DERECHO_ACCESO_DEEP_LINK,
  MINISTERIO_HACIENDA_ENTITY_ID,
  PROC_ID,
} from "../fixtures/mock-classification";

test.describe("Happy Path: Derecho de Acceso → Ministerio de Hacienda", () => {
  test.describe("User Story A: Civio power user — precise query", () => {
    const query = "solicitud acceso información Ministerio de Hacienda";

    test("A1–A3: Buscador classifies query and displays correct deepLink", async ({
      page,
    }) => {
      const buscador = new BuscadorPage(page);
      const classification = createMockClassification(query);

      await mockClassifyApi(page, classification);
      await buscador.goto();
      await expect(buscador.heading).toBeVisible();

      await buscador.search(query);
      await buscador.waitForResult();

      await expect(buscador.resultLabel).toHaveText(
        "Derecho de acceso — Ministerio de Hacienda"
      );

      await expect(
        page.getByText(/Tu solicitud va dirigida a/i)
      ).toBeVisible();
      await expect(
        page.getByText("Ministerio de Hacienda", { exact: true })
      ).toBeVisible();

      const href = await buscador.getDeepLinkHref();
      expect(href).toBe(HACIENDA_DERECHO_ACCESO_DEEP_LINK);

      const target = await buscador.getDeepLinkTarget();
      expect(target).toBe("_blank");
    });

    test("A4: Clicking deep-link opens Ministerio de Hacienda sede in new tab", async ({
      page,
    }) => {
      const buscador = new BuscadorPage(page);
      const classification = createMockClassification(query);

      await mockClassifyApi(page, classification);
      await buscador.goto();
      await buscador.search(query);
      await buscador.waitForResult();

      const newTab = await buscador.clickGoToPortal();

      const sedePage = new TransparenciaSedePage(newTab);
      expect(await sedePage.isSedePortal()).toBe(true);

      const params = await sedePage.hasProcedureParams();
      expect(params).not.toBeNull();
      expect(params!.idProc).toBe(String(PROC_ID));
      expect(params!.idAmb).toBe(String(MINISTERIO_HACIENDA_ENTITY_ID));
    });

    test("A5: Destination page loads right-of-access procedure for Hacienda", async ({
      page,
    }) => {
      const sedePage = new TransparenciaSedePage(page);
      await sedePage.navigateTo(HACIENDA_DERECHO_ACCESO_DEEP_LINK);

      expect(await sedePage.isSedePortal()).toBe(true);

      const params = await sedePage.hasProcedureParams();
      expect(params).not.toBeNull();
      expect(params!.idAmb).toBe(String(MINISTERIO_HACIENDA_ENTITY_ID));
    });
  });

  test.describe("User Story B: Average citizen — casual query", () => {
    const query = "quiero pedir información al ministerio de hacienda";

    test("B1–B4: Casual query is classified and shows step guide with deepLink", async ({
      page,
    }) => {
      const buscador = new BuscadorPage(page);
      const classification = createMockClassification(query);

      await mockClassifyApi(page, classification);
      await buscador.goto();
      await buscador.search(query);
      await buscador.waitForResult();

      await expect(buscador.resultLabel).toHaveText(
        "Derecho de acceso — Ministerio de Hacienda"
      );

      await expect(
        page.getByText(/Tu solicitud va dirigida a/i)
      ).toBeVisible();
      await expect(
        page.getByText("Ministerio de Hacienda", { exact: true })
      ).toBeVisible();

      const explanation = await buscador.explanation.innerText();
      expect(explanation.toLowerCase()).toContain("hacienda");

      const stepsCount = await buscador.getStepsCount();
      expect(stepsCount).toBeGreaterThanOrEqual(3);
      expect(stepsCount).toBeLessThanOrEqual(5);

      const href = await buscador.getDeepLinkHref();
      expect(href).toBe(HACIENDA_DERECHO_ACCESO_DEEP_LINK);
    });
  });
});
