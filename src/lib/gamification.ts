import { SupabaseClient } from "@supabase/supabase-js";
import confetti from "canvas-confetti";

export const checkAndUpdateStreak = async (supabase: SupabaseClient, profileId: string, currentStreak: number, lastLoginDate: string | null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  
  if (!lastLoginDate) {
    // First time login
    await supabase.from("profiles").update({ 
      current_streak: 1, 
      last_login_date: todayStr 
    }).eq("id", profileId);
    return 1;
  }

  const lastLogin = new Date(lastLoginDate);
  lastLogin.setHours(0, 0, 0, 0);
  
  const diffTime = Math.abs(today.getTime() - lastLogin.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays === 1) {
    // Consecutive day
    const newStreak = (currentStreak || 0) + 1;
    await supabase.from("profiles").update({ 
      current_streak: newStreak, 
      last_login_date: todayStr 
    }).eq("id", profileId);
    
    // Trigger confetti for streak milestone
    if (newStreak % 5 === 0) {
      triggerConfetti();
    }
    
    return newStreak;
  } else if (diffDays > 1) {
    // Streak broken
    await supabase.from("profiles").update({ 
      current_streak: 1, 
      last_login_date: todayStr 
    }).eq("id", profileId);
    return 1;
  }
  
  // Same day login
  return currentStreak;
};

export const triggerConfetti = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval: any = setInterval(function() {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, { particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    }));
    confetti(Object.assign({}, defaults, { particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    }));
  }, 250);
};

export const generateDailyQuests = async (supabase: SupabaseClient, profileId: string, currentQuests: any[], lastQuestReset: string | null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  
  if (lastQuestReset !== todayStr) {
    // Generate new quests
    const newQuests = [
      { id: "login", title: "Login to the Academy", xp_reward: 10, progress: 1, target: 1, is_claimed: true },
      { id: "complete_lesson", title: "Complete 1 Mission/Lesson", xp_reward: 50, progress: 0, target: 1, is_claimed: false },
      { id: "score_cbt", title: "Attempt a Quiz", xp_reward: 30, progress: 0, target: 1, is_claimed: false }
    ];
    
    await supabase.from("profiles").update({ 
      daily_quests: newQuests, 
      last_quest_reset: todayStr,
      xp: 10 // Give initial XP for login
    }).eq("id", profileId);
    
    return newQuests;
  }
  
  return currentQuests || [];
};
