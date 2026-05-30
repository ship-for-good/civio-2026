import { chromium } from "playwright";
import { ENTITY_LIST, portadaUrl } from "./entities";

async function main() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    console.error("Playwright launch failed — likely missing system dependencies. Using fallback JSON.");
    // Fallback: assume portada is the deepest we can reach without auth
    const fallback = ENTITY_LIST.map(e => ({
      idAmb: e.idAmb,
      name: e.name,
      deepestUrl: portadaUrl(e.idAmb),
      note: "fallback: portada (no browser available)"
    }));
    console.log(JSON.stringify(fallback, null, 2));
    return;
  }

  const results: Array<{ idAmb: number; name: string; deepestUrl: string; note: string }> = [];

  for (const entity of ENTITY_LIST) {
    const page = await browser.newPage();
    const pUrl = portadaUrl(entity.idAmb);
    let deepestUrl = pUrl;
    let note = "portada only";

    try {
      await page.goto(pUrl, { waitUntil: "domcontentloaded", timeout: 15000 });

      const acceder = page.locator("text=/acceder al procedimiento/i").first();
      if (await acceder.count() > 0) {
        await Promise.all([
          page.waitForNavigation({ timeout: 8000 }).catch(() => null),
          acceder.click(),
        ]);
        deepestUrl = page.url();

        if (deepestUrl.includes("clave") || deepestUrl.includes("authenticate")) {
          note = "blocked: clave";
        } else if (deepestUrl.includes("formulario")) {
          note = "reached: formulario";
        } else if (deepestUrl === pUrl) {
          note = "no navigation (SPA click?)";
        } else {
          note = "other redirect";
        }
      } else {
        note = "no CTA on portada";
      }
    } catch (err) {
      note = `error: ${(err as Error).message.slice(0, 60)}`;
    }

    const row = { idAmb: entity.idAmb, name: entity.name, deepestUrl, note };
    results.push(row);
    console.log(`${entity.idAmb} | ${entity.name.slice(0, 45).padEnd(45)} | ${note}`);
    await page.close();
  }

  console.log("\n=== JSON OUTPUT ===");
  console.log(JSON.stringify(
    results.map(r => ({ idAmb: r.idAmb, name: r.name, deepestUrl: r.deepestUrl, note: r.note })),
    null, 2
  ));

  await browser.close();
}

main().catch(console.error);
