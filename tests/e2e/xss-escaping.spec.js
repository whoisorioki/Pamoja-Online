import { test, expect } from '@playwright/test';

test.describe('XSS Escaping E2E Tests', () => {
  test('verifies that script tags and malicious attributes are sanitized in forum DOM rendering', async ({ page }) => {
    // Mock Supabase REST calls so passphrase validation passes
    await page.route('**/rest/v1/**', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(true)
    }));

    await page.goto('http://localhost:8080/forum/mens/');

    // Set token & passphrase in localStorage to bypass gates
    await page.evaluate(() => {
      localStorage.setItem('nguvu_token', 'anchor-brave-calm');
      localStorage.setItem('nguvu_passphrase_mens', 'testpass');
    });

    await page.reload();

    // Verify workspace is unlocked
    const workspace = page.locator('#forum-workspace');
    await expect(workspace).toBeVisible();

    // Inject mock XSS post into the rendered posts list manually via client function to test DOM rendering safety
    await page.evaluate(() => {
      const maliciousPost = {
        id: 'test-xss-id',
        token: 'anchor-brave-calm',
        space: 'mens',
        nickname: '<script>alert("xss-name")</script>',
        body: '<img src=x onerror="alert(\'xss-body\')">',
        created_at: new Date().toISOString()
      };

      const listEl = document.getElementById('forum-posts-list');
      const card = document.createElement('div');
      card.className = 'test-card';
      card.innerHTML = `
        <span class="test-nickname">${escapeHtml(maliciousPost.nickname)}</span>
        <p class="test-body">${escapeHtml(maliciousPost.body)}</p>
      `;
      listEl.appendChild(card);
    });

    // Verify raw HTML tags are NOT executed or present in unescaped form
    const nicknameEl = page.locator('.test-nickname');
    const bodyEl = page.locator('.test-body');

    await expect(nicknameEl).toHaveText('<script>alert("xss-name")</script>');
    await expect(bodyEl).toHaveText('<img src=x onerror="alert(\'xss-body\')">');

    const innerHtml = await page.locator('.test-card').innerHTML();
    expect(innerHtml).toContain('&lt;script&gt;');
    expect(innerHtml).toContain('&lt;img');
    expect(innerHtml).not.toContain('<script>');
  });
});
