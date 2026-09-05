-- Harden forum_posts_update_flag policy against column tampering
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
