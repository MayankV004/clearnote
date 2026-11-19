import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const outputDir = path.resolve(__dirname, '../../docs/screenshots/ui/error');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch();

  // 1. Desktop Light (1440x900) - 404
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:3000/dev/error', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: path.join(outputDir, 'desktop-light.png'), fullPage: true });
  console.log('Saved desktop-light.png (404)');

  // 2. Desktop Dark (1440x900) - 404
  const darkContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const darkPage = await darkContext.newPage();
  await darkPage.goto('http://localhost:3000/dev/error', { waitUntil: 'networkidle' });
  await darkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await darkPage.waitForTimeout(500);
  await darkPage.screenshot({ path: path.join(outputDir, 'desktop-dark.png'), fullPage: true });
  console.log('Saved desktop-dark.png (404)');

  // 3. Desktop Error Boundary (500)
  const errContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const errPage = await errContext.newPage();
  await errPage.goto('http://localhost:3000/dev/error', { waitUntil: 'networkidle' });
  await errPage.click('button:has-text("500 Error")');
  await errPage.waitForTimeout(400);
  await errPage.screenshot({ path: path.join(outputDir, 'error-boundary-desktop.png'), fullPage: true });
  console.log('Saved error-boundary-desktop.png (500)');

  // 4. Mobile Light (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/dev/error', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: path.join(outputDir, 'mobile-light.png'), fullPage: true });
  console.log('Saved mobile-light.png');

  // 5. Mobile Dark (390x844)
  const mobileDarkContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    isMobile: true,
  });
  const mobileDarkPage = await mobileDarkContext.newPage();
  await mobileDarkPage.goto('http://localhost:3000/dev/error', { waitUntil: 'networkidle' });
  await mobileDarkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await mobileDarkPage.waitForTimeout(500);
  await mobileDarkPage.screenshot({ path: path.join(outputDir, 'mobile-dark.png'), fullPage: true });
  console.log('Saved mobile-dark.png');

  await browser.close();
  console.log('All error screenshots captured successfully!');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
