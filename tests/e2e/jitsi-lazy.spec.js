import { test, expect } from '@playwright/test';

test.describe('Jitsi / 8x8 JaaS Lazy-Load E2E Tests', () => {
  test('lazy-loads the 8x8 JaaS external API only after clicking Join, without eager script tags', async ({ page }) => {
    const apiRequestUrls = [];
    let blockedInit = 0;

    // Deterministic: intercept the provider script so no real network is needed.
    await page.route('**/external_api.js', async (route) => {
      apiRequestUrls.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    });
    // A stubbed script means JitsiMeetExternalAPI will be undefined at init time;
    // the try/catch in week.njk must fall back to the plain-language error placeholder.
    page.on('pageerror', () => blockedInit++);

    await page.goto('http://localhost:8080/week/1/');

    // JAAS App ID injected into the page (client-side public tenant id)
    const appId = await page.evaluate(() => window.JAAS_APP_ID || '');
    expect(appId).toBe('vpaas-magic-cookie-98cd250b16ba47b9b4c874147a71d5c7');

    // Direct-launch fallback link resolves to the 8x8 JaaS room after DOMContentLoaded
    const directLink = page.locator('#direct-jitsi-link');
    await expect(directLink).toHaveAttribute('href', `https://8x8.vc/${appId}/NguvuPamoja-W1-Honesty`);

    // No external script tag in the served HTML (lazy-load only) — neither host
    await expect(page.locator('script[src*="external_api.js"]')).toHaveCount(0);
    expect(apiRequestUrls).toHaveLength(0);

    // Clicking loads the 8x8 JaaS external API exactly once
    await page.getByRole('button', { name: /Join Video Session/i }).click();
    await expect.poll(() => apiRequestUrls.length).toBe(1);
    expect(apiRequestUrls[0]).toBe(`https://8x8.vc/${appId}/external_api.js`);
    expect(blockedInit).toBe(0);
  });
});