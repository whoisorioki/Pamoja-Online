-- Nguvu Pamoja Online Platform — RLS Policy Isolation Test Suite
-- Sprint 0 Requirement: Verified RLS policies with dummy tokens before frontend wiring

BEGIN;

-- 1. Setup Test Passphrases
INSERT INTO forum_passphrases (space, passphrase) VALUES
  ('mens', 'brotherhood2026'),
  ('womens', 'sisterhood2026')
ON CONFLICT (space) DO UPDATE SET passphrase = EXCLUDED.passphrase;

-- 2. Test check_ins & journal_entries (Owner-Only & Cross-Token Isolation)
-- Simulate Request as Participant A (Token: "alpha-bravo-charlie")
SET LOCAL request.headers = '{"x-participant-token": "alpha-bravo-charlie"}';

INSERT INTO check_ins (token, week, challenge, victory)
VALUES ('alpha-bravo-charlie', 1, 'Fear of failure', 'Stayed consistent with prayer');

INSERT INTO journal_entries (token, week, entry)
VALUES ('alpha-bravo-charlie', 1, 'Today I felt supported by the group reflection.');

-- Verify Participant A can read own records
SELECT count(*) = 1 AS participant_a_checkin_readable FROM check_ins WHERE token = 'alpha-bravo-charlie';
SELECT count(*) = 1 AS participant_a_journal_readable FROM journal_entries WHERE token = 'alpha-bravo-charlie';

-- Simulate Request as Participant B (Token: "delta-echo-foxtrot")
SET LOCAL request.headers = '{"x-participant-token": "delta-echo-foxtrot"}';

-- Verify Participant B CANNOT read Participant A's check_ins or journal
SELECT count(*) = 0 AS cross_token_checkin_blocked FROM check_ins WHERE token = 'alpha-bravo-charlie';
SELECT count(*) = 0 AS cross_token_journal_blocked FROM journal_entries WHERE token = 'alpha-bravo-charlie';

-- Verify Participant B CANNOT update or delete Participant A's records
UPDATE check_ins SET challenge = 'Hacked' WHERE token = 'alpha-bravo-charlie';
SELECT count(*) = 1 AS checkin_unmodified FROM check_ins WHERE token = 'alpha-bravo-charlie' AND challenge = 'Fear of failure';

DELETE FROM journal_entries WHERE token = 'alpha-bravo-charlie';
SELECT count(*) = 1 AS journal_undeleted FROM journal_entries WHERE token = 'alpha-bravo-charlie';


-- 3. Test forum_posts (Space Passphrase Isolation & Cross-Space Protection)

-- Participant A posts in Men's Space with valid passphrase
SET LOCAL request.headers = '{"x-participant-token": "alpha-bravo-charlie", "x-mens-passphrase": "brotherhood2026"}';

INSERT INTO forum_posts (token, space, nickname, body)
VALUES ('alpha-bravo-charlie', 'mens', 'BrotherHope', 'Grateful for week 1 session.');

-- Participant B posts in Women's Space with valid passphrase
SET LOCAL request.headers = '{"x-participant-token": "delta-echo-foxtrot", "x-womens-passphrase": "sisterhood2026"}';

INSERT INTO forum_posts (token, space, nickname, body)
VALUES ('delta-echo-foxtrot', 'womens', 'SisterGrace', 'Finding strength in scriptures.');

-- Test Read Access for Men's Space (using Men's Passphrase)
SET LOCAL request.headers = '{"x-mens-passphrase": "brotherhood2026"}';
SELECT count(*) = 1 AS mens_space_readable FROM forum_posts WHERE space = 'mens';
SELECT count(*) = 0 AS womens_space_blocked_from_mens_passphrase FROM forum_posts WHERE space = 'womens';

-- Test Read Access for Women's Space (using Women's Passphrase)
SET LOCAL request.headers = '{"x-womens-passphrase": "sisterhood2026"}';
SELECT count(*) = 1 AS womens_space_readable FROM forum_posts WHERE space = 'womens';
SELECT count(*) = 0 AS mens_space_blocked_from_womens_passphrase FROM forum_posts WHERE space = 'mens';

-- Test Invalid Passphrase (Blocked Read)
SET LOCAL request.headers = '{"x-mens-passphrase": "wrong-passphrase"}';
SELECT count(*) = 0 AS invalid_passphrase_read_blocked FROM forum_posts WHERE space = 'mens';


-- 4. Test Forum Flag / Report Action
SET LOCAL request.headers = '{"x-mens-passphrase": "brotherhood2026"}';

-- Flag a post in men's space
UPDATE forum_posts SET flagged = true WHERE space = 'mens' AND nickname = 'BrotherHope';
SELECT flagged = true AS post_successfully_flagged FROM forum_posts WHERE space = 'mens' AND nickname = 'BrotherHope';

ROLLBACK;
