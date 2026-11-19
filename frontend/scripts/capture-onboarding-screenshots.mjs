import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const outputDir = path.resolve(__dirname, '../../docs/screenshots/ui/onboarding');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch();

  // 1. Desktop Light (1440x900) - Step 1
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:3000/dev/onboarding', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: path.join(outputDir, 'desktop-light.png'), fullPage: true });
  console.log('Saved desktop-light.png');

  // 2. Desktop Dark (1440x900) - Step 1
  const darkContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const darkPage = await darkContext.newPage();
  await darkPage.goto('http://localhost:3000/dev/onboarding', { waitUntil: 'networkidle' });
  await darkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await darkPage.waitForTimeout(500);
  await darkPage.screenshot({ path: path.join(outputDir, 'desktop-dark.png'), fullPage: true });
  console.log('Saved desktop-dark.png');

  // 3. Mobile Light (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/dev/onboarding', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: path.join(outputDir, 'mobile-light.png'), fullPage: true });
  console.log('Saved mobile-light.png');

  // 4. Mobile Dark (390x844)
  const mobileDarkContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
    isMobile: true,
  });
  const mobileDarkPage = await mobileDarkContext.newPage();
  await mobileDarkPage.goto('http://localhost:3000/dev/onboarding', { waitUntil: 'networkidle' });
  await mobileDarkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await mobileDarkPage.waitForTimeout(500);
  await mobileDarkPage.screenshot({ path: path.join(outputDir, 'mobile-dark.png'), fullPage: true });
  console.log('Saved mobile-dark.png');

  // 5. Step 3 with Digital Signature Pad
  const step3Page = await desktopContext.newPage();
  await step3Page.goto('http://localhost:3000/dev/onboarding', { waitUntil: 'networkidle' });
  // Click on Step 3 in the sidebar checklist
  await step3Page.click('button:has-text("Prescription Signature")');
  await step3Page.waitForTimeout(400);
  await step3Page.screenshot({ path: path.join(outputDir, 'step3-signature.png') });
  console.log('Saved step3-signature.png');

  await browser.close();
  console.log('All onboarding screenshots captured successfully.');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
