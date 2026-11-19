import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capture() {
  const outputDir = path.resolve(__dirname, '../../docs/screenshots/ui/dashboard');
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
  await desktopPage.goto('http://localhost:3000/dev/dashboard', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(500);
  await desktopPage.screenshot({ path: path.join(outputDir, 'desktop-light.png'), fullPage: true });
  console.log('Saved desktop-light.png');

  // 2. Desktop Dark (1440x900)
  const darkContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const darkPage = await darkContext.newPage();
  await darkPage.goto('http://localhost:3000/dev/dashboard', { waitUntil: 'networkidle' });
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
  await mobilePage.goto('http://localhost:3000/dev/dashboard', { waitUntil: 'networkidle' });
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
  await mobileDarkPage.goto('http://localhost:3000/dev/dashboard', { waitUntil: 'networkidle' });
  await mobileDarkPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await mobileDarkPage.waitForTimeout(500);
  await mobileDarkPage.screenshot({ path: path.join(outputDir, 'mobile-dark.png'), fullPage: true });
  console.log('Saved mobile-dark.png');

  // 5. Command Palette Modal (Cmd+K)
  const cmdPage = await desktopContext.newPage();
  await cmdPage.goto('http://localhost:3000/dev/dashboard', { waitUntil: 'networkidle' });
  await cmdPage.keyboard.press('Meta+k');
  await cmdPage.waitForTimeout(400);
  await cmdPage.screenshot({ path: path.join(outputDir, 'command-palette.png') });
  console.log('Saved command-palette.png');

  // 6. New Patient Dialog Modal
  const modalPage = await desktopContext.newPage();
  await modalPage.goto('http://localhost:3000/dev/dashboard', { waitUntil: 'networkidle' });
  await modalPage.click('button:has-text("New Patient")');
  await modalPage.waitForTimeout(400);
  await modalPage.screenshot({ path: path.join(outputDir, 'new-patient-dialog.png') });
  console.log('Saved new-patient-dialog.png');

  await browser.close();
  console.log('All dashboard screenshots captured successfully.');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
