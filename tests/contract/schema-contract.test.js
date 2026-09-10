import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Schema Contract Verification', () => {
  const schemaPath = path.resolve(__dirname, '../../supabase/migrations/20260904000000_schema_and_rls.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  it('migration file exists and is non-empty', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
    expect(schemaSql.length).toBeGreaterThan(100);
  });

  it('defines check_ins table with required columns', () => {
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS check_ins');
    expect(schemaSql).toContain('token text NOT NULL');
    expect(schemaSql).toContain('week int NOT NULL');
    expect(schemaSql).toContain('challenge text');
    expect(schemaSql).toContain('victory text');
  });

  it('defines journal_entries table with required columns', () => {
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS journal_entries');
    expect(schemaSql).toContain('token text NOT NULL');
    expect(schemaSql).toContain('week int NOT NULL');
    expect(schemaSql).toContain('entry text');
  });

  it('defines forum_posts table with required columns', () => {
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS forum_posts');
    expect(schemaSql).toContain('token text NOT NULL');
    expect(schemaSql).toContain('space text NOT NULL');
    expect(schemaSql).toContain('nickname text NOT NULL');
    expect(schemaSql).toContain('body text NOT NULL');
    expect(schemaSql).toContain('reply_to uuid');
    expect(schemaSql).toContain('flagged boolean DEFAULT false');
  });

  it('defines forum_passphrases helper table', () => {
    expect(schemaSql).toContain('CREATE TABLE IF NOT EXISTS forum_passphrases');
    expect(schemaSql).toContain('passphrase text NOT NULL');
  });

  it('enables Row Level Security (RLS) on all tables', () => {
    expect(schemaSql).toContain('ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY');
    expect(schemaSql).toContain('ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY');
    expect(schemaSql).toContain('ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY');
  });

  it('contains RLS policies for cross-token and cross-space protection', () => {
    expect(schemaSql).toContain('check_ins_select_owner');
    expect(schemaSql).toContain('journal_entries_select_owner');
    expect(schemaSql).toContain('forum_posts_select_space');
    expect(schemaSql).toContain('forum_posts_insert_author');
    expect(schemaSql).toContain('forum_posts_update_author');
    expect(schemaSql).toContain('forum_posts_update_flag');
    expect(schemaSql).toContain('forum_posts_delete_author');
  });

  it('defines the 90-day retention cron jobs for check_ins and journal_entries (SOT §9, G-05)', () => {
    const retentionPath = path.resolve(__dirname, '../../supabase/migrations/20260912000000_add_retention_cron.sql');
    expect(fs.existsSync(retentionPath)).toBe(true);
    const retentionSql = fs.readFileSync(retentionPath, 'utf-8');
    expect(retentionSql).toContain('create extension if not exists pg_cron');
    expect(retentionSql).toContain("'nguvu-purge-check-ins'");
    expect(retentionSql).toContain('from public.check_ins');
    expect(retentionSql).toContain("'nguvu-purge-journal-entries'");
    expect(retentionSql).toContain('from public.journal_entries');
    expect(retentionSql).toContain("interval '90 days'");
  });
});
