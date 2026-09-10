import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Passphrases for live RLS tests. In production these are read from the
// environment (current rotated cohort passphrases). A local dev fallback is
// provided for `supabase start`/`supabase db reset` seed values (G-07).
const MENS_PASSPHRASE = process.env.MENS_SPACE_PASSPHRASE || 'brotherhood2026';
const WOMENS_PASSPHRASE = process.env.WOMENS_SPACE_PASSPHRASE || 'sisterhood2026';

function createClientForParticipant(token, passphrase, spaceName) {
  const headers = {};

  if (token) {
    headers['x-participant-token'] = token.trim().toLowerCase();
  }

  if (passphrase && spaceName) {
    if (spaceName === 'mens') {
      headers['x-mens-passphrase'] = passphrase;
    } else if (spaceName === 'womens') {
      headers['x-womens-passphrase'] = passphrase;
    }
    headers['x-forum-passphrase'] = passphrase;
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers }
  });
}

describe('Live RLS Isolation Tests — Nguvu Pamoja', { timeout: 20000, hookTimeout: 20000 }, () => {
  beforeAll(() => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env');
    }
  });

  it('should enforce cross-token isolation on check_ins', async () => {
    const tokenA = 'alpha-bravo-charlie';
    const tokenB = 'delta-echo-foxtrot';

    const clientA = createClientForParticipant(tokenA, null, null);
    const clientB = createClientForParticipant(tokenB, null, null);

    // Participant A inserts a check-in
    const { data: insertedA, error: insertErr } = await clientA
      .from('check_ins')
      .insert({ token: tokenA, week: 1, challenge: 'Fear of failure', victory: 'Stayed consistent with prayer' })
      .select();

    expect(insertErr).toBeNull();
    expect(insertedA.length).toBeGreaterThan(0);

    // Participant A can read own check-in
    const { data: readA } = await clientA
      .from('check_ins')
      .select('*')
      .eq('token', tokenA);

    expect(readA.length).toBeGreaterThanOrEqual(1);

    // Participant B CANNOT read Participant A's check-in
    const { data: readB } = await clientB
      .from('check_ins')
      .select('*')
      .eq('token', tokenA);

    expect(readB.length).toBe(0);

    // Participant B CANNOT update Participant A's check-in
    const { data: updateB } = await clientB
      .from('check_ins')
      .update({ challenge: 'HACKED' })
      .eq('token', tokenA)
      .select();

    expect(updateB.length).toBe(0);

    // Participant B CANNOT delete Participant A's check-in
    const { data: deleteB } = await clientB
      .from('check_ins')
      .delete()
      .eq('token', tokenA)
      .select();

    expect(deleteB.length).toBe(0);
  });

  it('should enforce cross-token isolation on journal_entries', async () => {
    const tokenA = 'alpha-bravo-charlie';
    const tokenB = 'delta-echo-foxtrot';

    const clientA = createClientForParticipant(tokenA, null, null);
    const clientB = createClientForParticipant(tokenB, null, null);

    // Participant A inserts a journal entry
    await clientA
      .from('journal_entries')
      .insert({ token: tokenA, week: 1, entry: 'Today I felt supported by the group reflection.' });

    // Participant A can read own journal
    const { data: readA } = await clientA
      .from('journal_entries')
      .select('*')
      .eq('token', tokenA);

    expect(readA.length).toBeGreaterThanOrEqual(1);

    // Participant B CANNOT read Participant A's journal
    const { data: readB } = await clientB
      .from('journal_entries')
      .select('*')
      .eq('token', tokenA);

    expect(readB.length).toBe(0);
  });

  it('should enforce cross-space passphrase isolation on forum_posts', async () => {
    const tokenA = 'alpha-bravo-charlie';
    const tokenB = 'delta-echo-foxtrot';

    const mensClient = createClientForParticipant(tokenA, MENS_PASSPHRASE, 'mens');
    const womensClient = createClientForParticipant(tokenB, WOMENS_PASSPHRASE, 'womens');
    const noPassClient = createClientForParticipant(null, null, null);

    // Insert into men's space
    const { data: mensPost, error: mensErr } = await mensClient
      .from('forum_posts')
      .insert({ token: tokenA, space: 'mens', nickname: 'BrotherHope', body: 'Grateful for week 1 session.' })
      .select();

    expect(mensErr).toBeNull();
    expect(mensPost.length).toBeGreaterThan(0);

    // Insert into women's space
    const { data: womensPost, error: womensErr } = await womensClient
      .from('forum_posts')
      .insert({ token: tokenB, space: 'womens', nickname: 'SisterGrace', body: 'Finding strength in scriptures.' })
      .select();

    expect(womensErr).toBeNull();
    expect(womensPost.length).toBeGreaterThan(0);

    // Men's passphrase can read men's posts
    const { data: mensReadMens } = await mensClient
      .from('forum_posts')
      .select('*')
      .eq('space', 'mens');

    expect(mensReadMens.length).toBeGreaterThan(0);

    // Women's passphrase can read women's posts
    const { data: womensReadWomens } = await womensClient
      .from('forum_posts')
      .select('*')
      .eq('space', 'womens');

    expect(womensReadWomens.length).toBeGreaterThan(0);

    // Men's passphrase CANNOT read women's posts
    const { data: mensReadWomens } = await mensClient
      .from('forum_posts')
      .select('*')
      .eq('space', 'womens');

    expect(mensReadWomens.length).toBe(0);

    // Women's passphrase CANNOT read men's posts
    const { data: womensReadMens } = await womensClient
      .from('forum_posts')
      .select('*')
      .eq('space', 'mens');

    expect(womensReadMens.length).toBe(0);

    // No passphrase CANNOT read any posts
    const { data: noPassRead } = await noPassClient
      .from('forum_posts')
      .select('*');

    expect(noPassRead.length).toBe(0);

    // Wrong passphrase CANNOT read posts
    const wrongPassClient = createClientForParticipant(null, 'wrong-passphrase', 'mens');
    const { data: wrongRead } = await wrongPassClient
      .from('forum_posts')
      .select('*')
      .eq('space', 'mens');

    expect(wrongRead.length).toBe(0);
  });

  afterAll(async () => {
    const tokenA = 'alpha-bravo-charlie';
    const tokenB = 'delta-echo-foxtrot';

    const clientA = createClientForParticipant(tokenA, MENS_PASSPHRASE, 'mens');
    const clientB = createClientForParticipant(tokenB, WOMENS_PASSPHRASE, 'womens');

    try {
      await clientA.from('check_ins').delete().eq('token', tokenA);
      await clientB.from('check_ins').delete().eq('token', tokenB);
      await clientA.from('journal_entries').delete().eq('token', tokenA);
      await clientB.from('journal_entries').delete().eq('token', tokenB);
      await clientA.from('forum_posts').delete().eq('token', tokenA);
      await clientB.from('forum_posts').delete().eq('token', tokenB);
    } catch {
      // Best-effort test cleanup
    }
  }, 30000);
});