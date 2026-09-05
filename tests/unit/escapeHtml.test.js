import { describe, it, expect } from 'vitest';

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

describe('XSS Escaping Unit Tests (escapeHtml)', () => {
  it('escapes & → &amp;', () => {
    expect(escapeHtml('Peace & Grace')).toBe('Peace &amp; Grace');
  });

  it('escapes < → &lt;', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toContain('&lt;script');
  });

  it('escapes > → &gt;', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes " → &quot;', () => {
    expect(escapeHtml('Hello "World"')).toBe('Hello &quot;World&quot;');
  });

  it('escapes \' → &#039;', () => {
    expect(escapeHtml("User's entry")).toBe('User&#039;s entry');
  });

  it('handles combined XSS vectors correctly', () => {
    const malicious = `<img src="x" onerror='alert("xss & crime")'>`;
    const escaped = escapeHtml(malicious);
    expect(escaped).toBe('&lt;img src=&quot;x&quot; onerror=&#039;alert(&quot;xss &amp; crime&quot;)&#039;&gt;');
    expect(escaped).not.toContain('<');
    expect(escaped).not.toContain('>');
  });

  it('returns empty string for null, undefined, or empty input', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml('')).toBe('');
  });

  it('does NOT escape safe alphanumeric characters and standard punctuation', () => {
    const safeText = 'Hello World 123, how are you today?';
    expect(escapeHtml(safeText)).toBe(safeText);
  });
});
