import { test, expect } from '@playwright/test';

test.describe('Token Flow E2E Tests', () => {
  test('generates token, saves it, and displays token badge in nav bar', async ({ page }) => {
    await page.goto('http://localhost:8080/');

    // Initial state: badge should prompt setting token
    const badge = page.locator('#user-token-badge');
    await expect(badge).toContainText('Set Anonymous Token');

    // Click Generate Token
    const generateBtn = page.getByRole('button', { name: /Generate 3-Word Token/i });
    await generateBtn.click();

    // Verify token output display has 3 words separated by hyphens
    const tokenDisplay = page.locator('#new-token-display');
    await expect(tokenDisplay).toBeVisible();
    const tokenVal = (await tokenDisplay.innerText()).trim();
    expect(tokenVal.split('-').length).toBe(3);

    // Click Confirm & Save Token
    const confirmBtn = page.getByRole('button', { name: /I Have Saved My Token — Continue/i });
    await confirmBtn.click();

    // Verify nav badge now displays the token
    await expect(badge).toContainText(tokenVal);

    // Reload page to verify persistence in localStorage
    await page.reload();
    await expect(badge).toContainText(tokenVal);
  });
});
