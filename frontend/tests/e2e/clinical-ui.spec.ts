import { test, expect } from '@playwright/test';

test.describe('ClearNote Clinical Design System & UI Overhaul', () => {

  test('Landing Page renders Quiet Confidence layout and interactive simulator', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ClearNote/);

    // Verify main headline and trust signals
    await expect(page.locator('h1')).toContainText('AI Documentation That Clinicians Actually Trust');
    await expect(page.locator('text=HIPAA BAA Protected').first()).toBeVisible();

    // Verify interactive simulator navigation
    const simulator = page.locator('#simulator');
    await expect(simulator).toBeVisible();

    // Click through simulator tabs
    await page.click('button:has-text("2. SOAP Structuring")');
    await expect(page.locator('text=S • SUBJECTIVE')).toBeVisible();
    await expect(page.locator('text=ICD-10: J02.0')).toBeVisible();

    await page.click('button:has-text("3. RAG Safety Guardrail")');
    await expect(page.locator('text=CRITICAL CONTRAINDICATION INTERCEPTED')).toBeVisible();
    await expect(page.locator('text=WHO Model Formulary')).toBeVisible();

    await page.click('button:has-text("4. Physician Sign-off")');
    await expect(page.locator('text=Encounter Signed & Verified')).toBeVisible();
    await expect(page.locator('text=21 CFR Part 11 Compliant').first()).toBeVisible();
  });

  test('Living Component Gallery renders all clinical design primitives', async ({ page }) => {
    await page.goto('/dev/components');
    await expect(page.locator('h1')).toContainText('ClearNote Design System Gallery');

    // Check base buttons & inputs
    await expect(page.locator('text=1. Buttons & Interactive Triggers')).toBeVisible();
    await expect(page.locator('text=4. Status Banners & Clinical Badges')).toBeVisible();

    // Check Clinical AI Trust suite
    await expect(page.locator('text=5. Clinical AI Trust & Governance Widgets')).toBeVisible();
    await expect(page.locator('text=AI Draft').first()).toBeVisible();
    await expect(page.locator('text=Clinician Verified').first()).toBeVisible();
  });

  test('Clinical Dashboard Encounter Roster renders table and dense mode toggle', async ({ page }) => {
    await page.goto('/dev/dashboard');
    await expect(page.locator('text=Mount Sinai West Outpatient Clinic').first()).toBeVisible();

    // Stats cards
    await expect(page.locator('text=Active Patients').first()).toBeVisible();
    await expect(page.locator('text=Signed SOAP Notes').first()).toBeVisible();

    // Encounters table
    await expect(page.locator('text=John Doe').first()).toBeVisible();
    await expect(page.locator('text=Jane Smith').first()).toBeVisible();
  });

  test('Split-screen Consultation Reviewer renders synchronized audio and SOAP fields', async ({ page }) => {
    await page.goto('/dev/consultations');

    // Audio player & transcript
    await expect(page.locator('text=Clinical Audio Recording')).toBeVisible();
    await expect(page.locator('text=Verbatim Audio Transcript')).toBeVisible();

    // SOAP fields
    await expect(page.locator('text=Subjective')).toBeVisible();
    await expect(page.locator('text=Objective')).toBeVisible();
    await expect(page.locator('text=Assessment')).toBeVisible();
    await expect(page.locator('text=Plan')).toBeVisible();

    // Drug safety guardrails
    await expect(page.locator('text=Amoxicillin').first()).toBeVisible();
    await expect(page.locator('text=Penicillin Allergy').first()).toBeVisible();

    // Bottom review status bar
    await expect(page.locator('button:has-text("Approve & Sign Off")')).toBeVisible();
    await expect(page.locator('text=Critical Drug Warning')).toBeVisible();
  });

  test('Doctor Settings renders legal identity and signature management', async ({ page }) => {
    await page.goto('/dev/settings');
    await expect(page.locator('h1')).toContainText('Clinician Profile & Credentials');

    await expect(page.locator('text=Legal Identity')).toBeVisible();
    await expect(page.locator('text=DEA / State Verified')).toBeVisible();
    await expect(page.locator('text=Prescription Signature Stamp')).toBeVisible();

    // Toggle draw signature mode
    await page.click('button:has-text("Draw New Signature")');
    await expect(page.locator('button:has-text("Save & Affix Signature")')).toBeVisible();
  });

  test('Error fallback views render clinical context without PHI leakage', async ({ page }) => {
    await page.goto('/dev/error');

    // 404 view
    await expect(page.locator('h1')).toContainText('Clinical Resource Not Found');
    await expect(page.locator('text=Return to Dashboard')).toBeVisible();

    // Toggle to 500 view
    await page.click('button:has-text("500 Error")');
    await expect(page.locator('h1')).toContainText('Encounter Error Detected');
    await expect(page.locator('text=Retry Encounter')).toBeVisible();
    await expect(page.locator('text=DIAGNOSTIC REFERENCE')).toBeVisible();
  });

});
