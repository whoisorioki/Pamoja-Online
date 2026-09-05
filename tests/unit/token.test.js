import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// Read token.js source and execute in VM / eval context with mock localStorage
const tokenJsContent = fs.readFileSync(path.resolve(__dirname, '../../src/assets/js/token.js'), 'utf-8');

function setupTokenEnvironment() {
  const store = {};
  const mockLocalStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };

  const context = {
    localStorage: mockLocalStorage,
    document: {
      addEventListener: () => {},
      getElementById: () => null
    },
    Math,
    console
  };

  const fn = new Function('localStorage', 'document', 'Math', 'console', `
    ${tokenJsContent}
    return {
      generateThreeWordToken,
      getStoredToken,
      setStoredToken,
      clearStoredToken,
      getStoredNickname,
      setStoredNickname,
      getStoredPassphrase,
      setStoredPassphrase,
      clearStoredPassphrase,
      WORD_POOL,
      TOKEN_WORD_COUNT
    };
  `);

  return fn(mockLocalStorage, context.document, Math, console);
}

describe('Token Flow Unit Tests (token.js)', () => {
  let tokenEnv;

  beforeEach(() => {
    tokenEnv = setupTokenEnvironment();
  });

  it('generateThreeWordToken returns exactly 3 words separated by hyphens', () => {
    const token = tokenEnv.generateThreeWordToken();
    expect(typeof token).toBe('string');
    const parts = token.split('-');
    expect(parts.length).toBe(3);
  });

  it('generateThreeWordToken never returns duplicate words in a single token', () => {
    for (let i = 0; i < 50; i++) {
      const token = tokenEnv.generateThreeWordToken();
      const parts = token.split('-');
      const uniqueParts = new Set(parts);
      expect(uniqueParts.size).toBe(3);
    }
  });

  it('generateThreeWordToken returns different tokens on successive calls', () => {
    const token1 = tokenEnv.generateThreeWordToken();
    const token2 = tokenEnv.generateThreeWordToken();
    expect(token1).not.toBe(token2);
  });

  it('uses only words from WORD_POOL', () => {
    const token = tokenEnv.generateThreeWordToken();
    const parts = token.split('-');
    parts.forEach(word => {
      expect(tokenEnv.WORD_POOL).toContain(word);
    });
  });

  it('TOKEN_WORD_COUNT is set to 3', () => {
    expect(tokenEnv.TOKEN_WORD_COUNT).toBe(3);
  });

  it('stores, retrieves, and clears token in localStorage', () => {
    expect(tokenEnv.getStoredToken()).toBeNull();
    tokenEnv.setStoredToken('  Anchor-Brave-Calm  ');
    expect(tokenEnv.getStoredToken()).toBe('anchor-brave-calm');
    tokenEnv.clearStoredToken();
    expect(tokenEnv.getStoredToken()).toBeNull();
  });

  it('stores and retrieves nickname and passphrases', () => {
    tokenEnv.setStoredNickname('HopeSeeker');
    expect(tokenEnv.getStoredNickname()).toBe('HopeSeeker');

    tokenEnv.setStoredPassphrase('mens', 'grace2026');
    expect(tokenEnv.getStoredPassphrase('mens')).toBe('grace2026');

    tokenEnv.clearStoredPassphrase('mens');
    expect(tokenEnv.getStoredPassphrase('mens')).toBe('');
  });
});
