import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const output = '.impeccable/review';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
for (const [name, width, height] of [['desktop', 1440, 1050], ['mobile', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4310', { waitUntil: 'networkidle' });
  await page.locator('.product-card').first().waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map(image => image.decode().catch(() => {})));
  });
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
  results.push({ name, errors, ...(await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    brokenImages: Array.from(document.images).filter(image => !image.naturalWidth).map(image => image.src),
  }))) });
  await page.close();
}
await browser.close();
await writeFile(`${output}/checks.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
