import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const supabaseJsContent = fs.readFileSync(path.resolve(__dirname, '../../src/assets/js/supabase.js'), 'utf-8');

describe('Supabase Client Initializer (supabase.js)', () => {
  function setupMockEnvironment(customWindow = {}) {
    let createdClientConfig = null;

    const mockSupabaseLib = {
      createClient: (url, anonKey, options) => {
        createdClientConfig = { url, anonKey, options };
        return { client: true, options };
      }
    };

    const windowObj = {
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key-12345',
      supabase: mockSupabaseLib,
      ...customWindow
    };

    const fn = new Function('window', 'console', `
      ${supabaseJsContent}
      return { getSupabaseClient, getClientConfig: () => ${JSON.stringify(createdClientConfig)} };
    `);

    // Run code to get function
    const getSupabaseClient = (token, passphrase, spaceName) => {
      const globalFn = new Function('window', 'console', 'token', 'passphrase', 'spaceName', `
        ${supabaseJsContent}
        return getSupabaseClient(token, passphrase, spaceName);
      `);
      return globalFn(windowObj, console, token, passphrase, spaceName);
    };

    return { getSupabaseClient, getCreatedConfig: () => createdClientConfig };
  }

  it('sets x-participant-token header when token is provided', () => {
    let capturedOptions = null;
    const windowObj = {
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      supabase: {
        createClient: (url, key, options) => {
          capturedOptions = options;
          return { dummyClient: true };
        }
      }
    };

    const fn = new Function('window', 'token', 'passphrase', 'spaceName', `
      ${supabaseJsContent}
      return getSupabaseClient(token, passphrase, spaceName);
    `);

    fn(windowObj, 'anchor-brave-calm', null, null);
    expect(capturedOptions.global.headers['x-participant-token']).toBe('anchor-brave-calm');
  });

  it('sets x-mens-passphrase header when spaceName is "mens"', () => {
    let capturedOptions = null;
    const windowObj = {
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      supabase: {
        createClient: (url, key, options) => {
          capturedOptions = options;
          return { dummyClient: true };
        }
      }
    };

    const fn = new Function('window', 'token', 'passphrase', 'spaceName', `
      ${supabaseJsContent}
      return getSupabaseClient(token, passphrase, spaceName);
    `);

    fn(windowObj, 'anchor-brave-calm', 'mens-pass-123', 'mens');
    expect(capturedOptions.global.headers['x-mens-passphrase']).toBe('mens-pass-123');
    expect(capturedOptions.global.headers['x-forum-passphrase']).toBe('mens-pass-123');
  });

  it('sets x-womens-passphrase header when spaceName is "womens"', () => {
    let capturedOptions = null;
    const windowObj = {
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      supabase: {
        createClient: (url, key, options) => {
          capturedOptions = options;
          return { dummyClient: true };
        }
      }
    };

    const fn = new Function('window', 'token', 'passphrase', 'spaceName', `
      ${supabaseJsContent}
      return getSupabaseClient(token, passphrase, spaceName);
    `);

    fn(windowObj, 'anchor-brave-calm', 'womens-pass-456', 'womens');
    expect(capturedOptions.global.headers['x-womens-passphrase']).toBe('womens-pass-456');
    expect(capturedOptions.global.headers['x-forum-passphrase']).toBe('womens-pass-456');
  });

  it('returns null when window.supabase library is missing', () => {
    const windowObj = {
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
      supabase: undefined
    };

    const fn = new Function('window', `
      ${supabaseJsContent}
      return getSupabaseClient('token');
    `);

    expect(fn(windowObj)).toBeNull();
  });
});
