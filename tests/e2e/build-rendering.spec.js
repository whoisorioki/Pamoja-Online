import { test, expect } from '@playwright/test';

test.describe('Build Page Rendering Tests', () => {
  const pagesToTest = [
    { url: 'http://localhost:8080/' },
    { url: 'http://localhost:8080/journal/' },
    { url: 'http://localhost:8080/forum/mens/' },
    { url: 'http://localhost:8080/forum/womens/' },
    { url: 'http://localhost:8080/resources/' },
    { url: 'http://localhost:8080/check-in/1/' },
    { url: 'http://localhost:8080/week/1/' }
  ];

  for (const p of pagesToTest) {
    test(`renders ${p.url} cleanly without uncaught JS errors`, async ({ page }) => {
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(p.url);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);

      // Verify header logo is visible
      const logo = page.locator('.site-logo');
      await expect(logo).toBeVisible();

      // Filter out network errors due to mock/local environment missing live Supabase endpoint
      const fatalErrors = consoleErrors.filter(err => !err.includes('Failed to load resource') && !err.includes('fetch'));
      expect(fatalErrors.length).toBe(0);
    });
  }
});
