-- Nguvu Pamoja Online Platform — Supabase Schema & Row Level Security (RLS)
-- Architecture Authority: SOT v1.3 (§7, §8, §9)

-- 1. Helper table for Forum Space Passphrases
-- Storage for per-cycle space passphrases. Access restricted to internal RLS functions.
CREATE TABLE IF NOT EXISTS forum_passphrases (
  space text PRIMARY KEY CHECK (space IN ('mens', 'womens')),
  passphrase text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Revoke direct permissions from public/anon/authenticated roles.
-- Only service_role (Supabase admins) and SECURITY DEFINER functions can access.
REVOKE ALL ON forum_passphrases FROM PUBLIC, anon, authenticated;

-- Helper functions for extracting headers & validating passphrases
CREATE OR REPLACE FUNCTION current_participant_token()
RETURNS text AS $$
BEGIN
  RETURN coalesce(
    current_setting('request.headers', true)::json->>'x-participant-token',
    ''
  );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_space_passphrase(p_space text)
RETURNS text AS $$
BEGIN
  IF p_space = 'mens' THEN
    RETURN coalesce(
      current_setting('request.headers', true)::json->>'x-mens-passphrase',
      current_setting('request.headers', true)::json->>'x-forum-passphrase',
      ''
    );
  ELSIF p_space = 'womens' THEN
    RETURN coalesce(
      current_setting('request.headers', true)::json->>'x-womens-passphrase',
      current_setting('request.headers', true)::json->>'x-forum-passphrase',
      ''
    );
  ELSE
    RETURN '';
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_valid_space_passphrase(p_space text, p_passphrase text)
RETURNS boolean AS $$
DECLARE
  v_count int;
BEGIN
  IF p_space IS NULL OR p_passphrase IS NULL OR p_passphrase = '' THEN
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM forum_passphrases
  WHERE space = p_space AND passphrase = p_passphrase;

  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Table: check_ins (SOT §8)
CREATE TABLE IF NOT EXISTS check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  week int NOT NULL,
  challenge text,
  victory text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- RLS: check_ins (Owner-only read/write by token)
DROP POLICY IF EXISTS "check_ins_select_owner" ON check_ins;
CREATE POLICY "check_ins_select_owner"
  ON check_ins FOR SELECT
  USING (token = current_participant_token() AND token <> '');

DROP POLICY IF EXISTS "check_ins_insert_owner" ON check_ins;
CREATE POLICY "check_ins_insert_owner"
  ON check_ins FOR INSERT
  WITH CHECK (token = current_participant_token() AND token <> '');

DROP POLICY IF EXISTS "check_ins_update_owner" ON check_ins;
CREATE POLICY "check_ins_update_owner"
  ON check_ins FOR UPDATE
  USING (token = current_participant_token() AND token <> '')
  WITH CHECK (token = current_participant_token() AND token <> '');

DROP POLICY IF EXISTS "check_ins_delete_owner" ON check_ins;
CREATE POLICY "check_ins_delete_owner"
  ON check_ins FOR DELETE
  USING (token = current_participant_token() AND token <> '');

-- 3. Table: journal_entries (SOT §8)
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,
  week int NOT NULL,
  entry text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS: journal_entries (Owner-only read/write by token)
DROP POLICY IF EXISTS "journal_entries_select_owner" ON journal_entries;
CREATE POLICY "journal_entries_select_owner"
  ON journal_entries FOR SELECT
  USING (token = current_participant_token() AND token <> '');

DROP POLICY IF EXISTS "journal_entries_insert_owner" ON journal_entries;
CREATE POLICY "journal_entries_insert_owner"
  ON journal_entries FOR INSERT
  WITH CHECK (token = current_participant_token() AND token <> '');

DROP POLICY IF EXISTS "journal_entries_update_owner" ON journal_entries;
CREATE POLICY "journal_entries_update_owner"
  ON journal_entries FOR UPDATE
  USING (token = current_participant_token() AND token <> '')
  WITH CHECK (token = current_participant_token() AND token <> '');

DROP POLICY IF EXISTS "journal_entries_delete_owner" ON journal_entries;
CREATE POLICY "journal_entries_delete_owner"
  ON journal_entries FOR DELETE
  USING (token = current_participant_token() AND token <> '');

-- 4. Table: forum_posts (SOT §8)
CREATE TABLE IF NOT EXISTS forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL,        -- author's token; edit/delete rights only, never displayed
  space text NOT NULL CHECK (space IN ('mens', 'womens')),
  nickname text NOT NULL,     -- display name chosen by the participant; separate from token, never token
  body text NOT NULL,
  reply_to uuid NULL REFERENCES forum_posts(id),   -- post/reply model
  flagged boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

-- RLS: forum_posts
-- Read: Scoped to whoever presents a valid space passphrase
DROP POLICY IF EXISTS "forum_posts_select_space" ON forum_posts;
CREATE POLICY "forum_posts_select_space"
  ON forum_posts FOR SELECT
  USING (is_valid_space_passphrase(space, get_space_passphrase(space)));

-- Insert: Author token matching + valid space passphrase + nickname cannot equal token
DROP POLICY IF EXISTS "forum_posts_insert_author" ON forum_posts;
CREATE POLICY "forum_posts_insert_author"
  ON forum_posts FOR INSERT
  WITH CHECK (
    is_valid_space_passphrase(space, get_space_passphrase(space))
    AND token = current_participant_token()
    AND token <> ''
    AND nickname <> token
  );

-- Update (Author): Edit own post
DROP POLICY IF EXISTS "forum_posts_update_author" ON forum_posts;
CREATE POLICY "forum_posts_update_author"
  ON forum_posts FOR UPDATE
  USING (
    token = current_participant_token()
    AND token <> ''
    AND is_valid_space_passphrase(space, get_space_passphrase(space))
  )
  WITH CHECK (
    token = current_participant_token()
    AND token <> ''
    AND is_valid_space_passphrase(space, get_space_passphrase(space))
    AND nickname <> token
  );

-- Update (Flag/Report): Space-holders can flag a post (set flagged = true)
DROP POLICY IF EXISTS "forum_posts_update_flag" ON forum_posts;
CREATE POLICY "forum_posts_update_flag"
  ON forum_posts FOR UPDATE
  USING (
    is_valid_space_passphrase(space, get_space_passphrase(space))
  )
  WITH CHECK (
    is_valid_space_passphrase(space, get_space_passphrase(space))
    AND flagged = true
    AND token = forum_posts.token
    AND space = forum_posts.space
    AND nickname = forum_posts.nickname
    AND body = forum_posts.body
    AND coalesce(reply_to, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(forum_posts.reply_to, '00000000-0000-0000-0000-000000000000'::uuid)
  );


-- Delete: Author-only
DROP POLICY IF EXISTS "forum_posts_delete_author" ON forum_posts;
CREATE POLICY "forum_posts_delete_author"
  ON forum_posts FOR DELETE
  USING (
    token = current_participant_token()
    AND token <> ''
    AND is_valid_space_passphrase(space, get_space_passphrase(space))
  );

-- Grant appropriate permissions to anon role for Supabase client usage
GRANT SELECT, INSERT, UPDATE, DELETE ON check_ins TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON forum_posts TO anon;

-- Seed default initial space passphrases
INSERT INTO forum_passphrases (space, passphrase) VALUES
  ('mens', 'brotherhood2026'),
  ('womens', 'sisterhood2026')
ON CONFLICT (space) DO UPDATE SET passphrase = EXCLUDED.passphrase;
