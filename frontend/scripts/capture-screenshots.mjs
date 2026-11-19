import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const outputDir = path.resolve(__dirname, '../../docs/screenshots/ui/dev-components');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch();

  // 1. Desktop Light (1440x900)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:3000/dev/components', { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: path.join(outputDir, 'desktop-light.png'), fullPage: true });
  console.log('Saved desktop-light.png');

  // 2. Desktop Dark (1440x900)
  const darkContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const darkPage = await darkContext.newPage();
  await darkPage.goto('http://localhost:3000/dev/components', { waitUntil: 'networkidle' });
  await darkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await darkPage.waitForTimeout(300);
  await darkPage.screenshot({ path: path.join(outputDir, 'desktop-dark.png'), fullPage: true });
  console.log('Saved desktop-dark.png');

  // 3. Mobile Light (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/dev/components', { waitUntil: 'networkidle' });
  await mobilePage.screenshot({ path: path.join(outputDir, 'mobile-light.png'), fullPage: true });
  console.log('Saved mobile-light.png');

  // 4. Mobile Dark (390x844)
  const mobileDarkContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    isMobile: true,
  });
  const mobileDarkPage = await mobileDarkContext.newPage();
  await mobileDarkPage.goto('http://localhost:3000/dev/components', { waitUntil: 'networkidle' });
  await mobileDarkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await mobileDarkPage.waitForTimeout(300);
  await mobileDarkPage.screenshot({ path: path.join(outputDir, 'mobile-dark.png'), fullPage: true });
  console.log('Saved mobile-dark.png');

  // 5. Desktop Modal Dialog
  await desktopPage.click('text=Open Standard Modal Dialog');
  await desktopPage.waitForTimeout(300);
  await desktopPage.screenshot({ path: path.join(outputDir, 'dialog-modal.png') });
  console.log('Saved dialog-modal.png');

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
