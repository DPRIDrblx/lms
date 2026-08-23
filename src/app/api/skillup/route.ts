import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the student's profile to know their class level
    const { data: profile } = await supabase
      .from("profiles")
      .select("class_id, class:classes(name), skill_coins")
      .eq("id", userId)
      .single();

    // Fetch all missions
    const { data: missions, error: missionsError } = await supabase
      .from("skillup_missions")
      .select("*, tasks:skillup_tasks(*)")
      .order("order_index", { ascending: true });

    if (missionsError) {
      console.error("Error fetching missions:", missionsError);
      return NextResponse.json({ error: missionsError.message, fallback: true }, { status: 500 });
    }

    // Fetch student's progress for these tasks
    const { data: progressData, error: progressError } = await supabase
      .from("skillup_progress")
      .select("task_id, is_completed")
      .eq("student_id", userId);

    if (progressError) {
      console.error("Error fetching progress:", progressError);
    }

    // Map progress to tasks
    const progressMap = new Map();
    if (progressData) {
      progressData.forEach((p: any) => {
        progressMap.set(p.task_id, p.is_completed);
      });
    }

    const processedMissions = missions?.map((mission: any) => {
      const processedTasks = mission.tasks
        ?.sort((a: any, b: any) => a.order_index - b.order_index)
        .map((task: any) => ({
          ...task,
          is_completed: progressMap.get(task.id) || false
        }));

      return {
        ...mission,
        tasks: processedTasks
      };
    });

    return NextResponse.json({ 
      missions: processedMissions || [],
      skill_coins: profile?.skill_coins || 0
    });

  } catch (error) {
    console.error("Skill Up API Error:", error);
    return NextResponse.json({ error: "Internal Server Error", fallback: true }, { status: 500 });
  }
}
