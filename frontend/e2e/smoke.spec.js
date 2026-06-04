import { test, expect } from '@playwright/test';

test.describe('Beatzy smoke', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('BEATZY')).toBeVisible();
    await expect(page.getByRole('heading', { name: /decode the dna/i })).toBeVisible();
  });

  test('pricing page loads', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.locator('body')).toBeVisible();
  });

  test('status page loads', async ({ page }) => {
    await page.goto('/status');
    await expect(page.getByRole('heading', { name: /status/i })).toBeVisible();
  });

  test('login form renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
