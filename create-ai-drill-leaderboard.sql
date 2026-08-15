CREATE OR REPLACE VIEW ai_drill_leaderboard AS
SELECT 
  p.id as student_id,
  p.full_name,
  p.avatar_url,
  COALESCE(SUM(r.correct_answers), 0) as total_correct,
  COALESCE(SUM(r.correct_answers) * 10, 0) as total_xp
FROM profiles p
JOIN ai_drill_results r ON p.id = r.student_id
WHERE p.role = 'student'
GROUP BY p.id, p.full_name, p.avatar_url;
