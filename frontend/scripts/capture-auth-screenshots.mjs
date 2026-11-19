import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const outputDir = path.resolve(__dirname, '../../docs/screenshots/ui/sign-in');
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
  await desktopPage.goto('http://localhost:3000/sign-in', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForTimeout(1000);
  await desktopPage.screenshot({ path: path.join(outputDir, 'desktop-light.png') });
  console.log('Saved sign-in/desktop-light.png');

  // 2. Desktop Dark (1440x900)
  const darkContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const darkPage = await darkContext.newPage();
  await darkPage.goto('http://localhost:3000/sign-in', { waitUntil: 'domcontentloaded' });
  await darkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await darkPage.waitForTimeout(1000);
  await darkPage.screenshot({ path: path.join(outputDir, 'desktop-dark.png') });
  console.log('Saved sign-in/desktop-dark.png');

  // 3. Mobile Light (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/sign-in', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForTimeout(1000);
  await mobilePage.screenshot({ path: path.join(outputDir, 'mobile-light.png') });
  console.log('Saved sign-in/mobile-light.png');

  // 4. Mobile Dark (390x844)
  const mobileDarkContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    isMobile: true,
  });
  const mobileDarkPage = await mobileDarkContext.newPage();
  await mobileDarkPage.goto('http://localhost:3000/sign-in', { waitUntil: 'domcontentloaded' });
  await mobileDarkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await mobileDarkPage.waitForTimeout(1000);
  await mobileDarkPage.screenshot({ path: path.join(outputDir, 'mobile-dark.png') });
  console.log('Saved sign-in/mobile-dark.png');

  await browser.close();
  console.log('Auth screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
