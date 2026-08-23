import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { task_id } = body;

    if (!task_id) {
      return NextResponse.json({ error: "Missing task_id" }, { status: 400 });
    }

    // 1. Check if task exists and get reward amount
    const { data: task, error: taskError } = await supabase
      .from("skillup_tasks")
      .select("reward_coins")
      .eq("id", task_id)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // 2. Check if already completed to prevent duplicate rewards
    const { data: existingProgress } = await supabase
      .from("skillup_progress")
      .select("is_completed")
      .eq("student_id", userId)
      .eq("task_id", task_id)
      .single();

    if (existingProgress?.is_completed) {
      return NextResponse.json({ message: "Already completed" }, { status: 200 });
    }

    // 3. Update Progress (Upsert)
    const { error: progressError } = await supabase
      .from("skillup_progress")
      .upsert({
        student_id: userId,
        task_id: task_id,
        is_completed: true,
        completed_at: new Date().toISOString()
      }, { onConflict: 'student_id, task_id' });

    if (progressError) {
      throw progressError;
    }

    // 4. Reward the Skill Coins
    const { data: profile } = await supabase
      .from("profiles")
      .select("skill_coins")
      .eq("id", userId)
      .single();

    const currentCoins = profile?.skill_coins || 0;
    const newCoins = currentCoins + (task.reward_coins || 10);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ skill_coins: newCoins })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating skill coins:", profileError);
    }

    return NextResponse.json({ 
      success: true, 
      rewarded: task.reward_coins || 10,
      total_coins: newCoins
    });

  } catch (error: any) {
    console.error("Skill Up Progress Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
