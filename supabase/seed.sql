-- Initial default space passphrases for testing/development
INSERT INTO forum_passphrases (space, passphrase) VALUES
  ('mens', 'brotherhood2026'),
  ('womens', 'sisterhood2026')
ON CONFLICT (space) DO UPDATE SET passphrase = EXCLUDED.passphrase;
