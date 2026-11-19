import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const outputDir = path.resolve(__dirname, '../../docs/screenshots/ui/landing');
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
  await desktopPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(600);
  await desktopPage.screenshot({ path: path.join(outputDir, 'desktop-light.png'), fullPage: true });
  console.log('Saved desktop-light.png');

  // 2. Desktop Dark (1440x900)
  const darkContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const darkPage = await darkContext.newPage();
  await darkPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await darkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await darkPage.waitForTimeout(600);
  await darkPage.screenshot({ path: path.join(outputDir, 'desktop-dark.png'), fullPage: true });
  console.log('Saved desktop-dark.png');

  // 3. Simulator RAG Stage Detail (Desktop)
  await desktopPage.click('button:has-text("3. RAG Safety Guardrail")');
  await desktopPage.waitForTimeout(400);
  const simElement = await desktopPage.$('#simulator');
  if (simElement) {
    await simElement.screenshot({ path: path.join(outputDir, 'simulator-rag-interaction.png') });
    console.log('Saved simulator-rag-interaction.png');
  }

  // 4. Mobile Light (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(600);
  await mobilePage.screenshot({ path: path.join(outputDir, 'mobile-light.png'), fullPage: true });
  console.log('Saved mobile-light.png');

  // 5. Mobile Dark (390x844)
  const mobileDarkContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    isMobile: true,
  });
  const mobileDarkPage = await mobileDarkContext.newPage();
  await mobileDarkPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await mobileDarkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await mobileDarkPage.waitForTimeout(600);
  await mobileDarkPage.screenshot({ path: path.join(outputDir, 'mobile-dark.png'), fullPage: true });
  console.log('Saved mobile-dark.png');

  await browser.close();
  console.log('All landing page screenshots captured successfully!');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
