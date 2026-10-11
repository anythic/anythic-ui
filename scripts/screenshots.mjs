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
// "social" is the GitHub social preview card (Settings → Social preview).
const SCENES = ["hero", "chat", "social"];

mkdirSync(OUT_DIR, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });

for (const colorScheme of ["light", "dark"]) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 }, // wider than the widest scene (social, 1280)
    deviceScaleFactor: 2,
    colorScheme,
    reducedMotion: "reduce",
  });
  await page.goto(`${DOCS_URL}/showcase`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  for (const name of SCENES) {
    const path = `${OUT_DIR}/${name}-${colorScheme}.png`;
    // Scenes can sit at fractional positions; snap the crop to whole pixels so
    // each image is exactly the scene's size (the social card must be 1280×640).
    const box = await page.locator(`[data-shot="${name}"]`).boundingBox();
    const clip = {
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
    };
    await page.screenshot({ path, clip, fullPage: true, animations: "disabled" });
    console.log(`Saved ${path}`);
  }
  await page.close();
}

await browser.close();
