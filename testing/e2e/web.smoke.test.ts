import { test, expect } from '@playwright/test';

test('Web app loads main page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/HeyTCM/);
});
