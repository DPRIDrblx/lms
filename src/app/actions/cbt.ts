"use server"

import { createClient } from "@supabase/supabase-js"

export async function awardCbtStars(studentId: string, scheduleId: string, starsEarned: number) {
  if (starsEarned <= 0) return { success: true };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { success: false, error: "Missing Supabase credentials" };
  }

  // Create an admin client bypassing RLS
  const supabase = createClient(supabaseUrl, supabaseKey);

  // check if exist
  const { data: existingStars } = await supabase
    .from("student_stars")
    .select("id, stars")
    .eq("schedule_id", scheduleId)
    .eq("student_id", studentId)
    .single();
    
  if (existingStars) {
    const { error } = await supabase
      .from("student_stars")
      .update({ stars: existingStars.stars + starsEarned })
      .eq("id", existingStars.id);
      
    if (error) return { success: false, error: error.message };
  } else {
    // We need tutor_id for inserting into student_stars
    const { data: schedule } = await supabase
      .from("center_schedules")
      .select("tutor_id")
      .eq("id", scheduleId)
      .single();
      
    const tutorId = schedule?.tutor_id || null;

    const { error } = await supabase
      .from("student_stars")
      .insert({
        student_id: studentId,
        schedule_id: scheduleId,
        tutor_id: tutorId,
        stars: starsEarned
      });
      
    if (error) return { success: false, error: error.message };
  }
  
  return { success: true };
}
