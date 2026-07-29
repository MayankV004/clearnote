import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');
  // Checking that the basic page loads
  await expect(page).toHaveTitle(/ClearNote/);
});

test('unauthenticated users are redirected to sign in', async ({ page }) => {
  await page.goto('/dashboard');
  // Wait for Clerk to redirect to sign-in
  await expect(page).toHaveURL(/.*sign-in.*/);
});
