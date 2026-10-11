// Captures the scenes on the docs /showcase page as the README images, in
// light and dark, at 2x. Start the docs app first (`pnpm dev`, or
// `pnpm build && pnpm --filter docs start`), then run `pnpm screenshots`.
//
//   DOCS_URL        where the docs app runs (default http://localhost:3000)
//   CHROMIUM_PATH   a Chromium to use instead of Playwright's own download
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const DOCS_URL = process.env.DOCS_URL ?? "http://localhost:3000";
const OUT_DIR = ".github/assets";
const SCENES = ["hero", "chat"];

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });

for (const colorScheme of ["light", "dark"]) {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 1200 },
    deviceScaleFactor: 2,
    colorScheme,
    reducedMotion: "reduce",
  });
  await page.goto(`${DOCS_URL}/showcase`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  for (const name of SCENES) {
    const path = `${OUT_DIR}/${name}-${colorScheme}.png`;
    await page.locator(`[data-shot="${name}"]`).screenshot({ path, animations: "disabled" });
    console.log(`Saved ${path}`);
  }
  await page.close();
}

await browser.close();
