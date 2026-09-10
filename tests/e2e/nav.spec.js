import { test, expect } from '@playwright/test';

test.describe('Site Navigation Uniformity', () => {
  const expectedLabels = ['Home', 'Check In', 'Journal', 'Forum', 'Support'];
  const routes = [
    '/',
    '/week/1/',
    '/check-in/1/',
    '/journal/',
    '/forum/mens/',
    '/forum/womens/',
    '/resources/',
  ];

  for (const route of routes) {
    test(`renders the five uniform nav labels on ${route}`, async ({ page }) => {
      await page.goto('http://localhost:8080' + route);
      const labels = await page.locator('header .nav-link').allInnerTexts();
      expect(labels).toEqual(expectedLabels);
    });
  }

  test('marks exactly one current-page link as active with aria-current', async ({ page }) => {
    const cases = [
      ['/', 'Home'],
      ['/check-in/1/', 'Check In'],
      ['/check-in/5/', 'Check In'],
      ['/journal/', 'Journal'],
      ['/forum/mens/', 'Forum'],
      ['/forum/womens/', 'Forum'],
      ['/resources/', 'Support'],
    ];

    for (const [route, label] of cases) {
      await page.goto('http://localhost:8080' + route);
      const active = page.locator('header .nav-link.active');
      await expect(active).toHaveCount(1);
      await expect(active).toHaveText(label);
      await expect(active).toHaveAttribute('aria-current', 'page');
    }
  });

  test('does not mark any week page as active (curriculum is not a top-level section)', async ({ page }) => {
    await page.goto('http://localhost:8080/week/1/');
    await expect(page.locator('header .nav-link.active')).toHaveCount(0);
  });
});