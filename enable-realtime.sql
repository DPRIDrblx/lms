-- Enable realtime for chatting and social
BEGIN;
  -- Remove tables from publication if they exist to avoid duplicate errors, then add them
  -- But simpler: just add. If it fails, we catch it.
  -- A safe way is to add tables that we want realtime for.
  ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
  ALTER PUBLICATION supabase_realtime ADD TABLE posts;
COMMIT;
