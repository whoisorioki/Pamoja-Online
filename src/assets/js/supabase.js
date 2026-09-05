// Nguvu Pamoja — Supabase Client Module
// Uses build-time injected environment variables window.SUPABASE_URL and window.SUPABASE_ANON_KEY

function getSupabaseClient(participantToken, spacePassphrase, spaceName) {
  const url = window.SUPABASE_URL || '';
  const key = window.SUPABASE_ANON_KEY || '';

  if (!url || !key) {
    console.warn('Nguvu Pamoja: Supabase URL or Anon Key missing from environment.');
  }

  const headers = {};

  if (participantToken) {
    headers['x-participant-token'] = participantToken.trim().toLowerCase();
  }

  if (spacePassphrase && spaceName) {
    if (spaceName === 'mens') {
      headers['x-mens-passphrase'] = spacePassphrase;
    } else if (spaceName === 'womens') {
      headers['x-womens-passphrase'] = spacePassphrase;
    }
    headers['x-forum-passphrase'] = spacePassphrase;
  }

  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    return window.supabase.createClient(url, key, {
      global: {
        headers: headers
      }
    });
  } else {
    console.error('Nguvu Pamoja: Supabase JS library is not loaded on window.');
    return null;
  }
}
