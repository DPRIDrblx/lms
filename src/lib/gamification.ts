import { SupabaseClient } from "@supabase/supabase-js";
import confetti from "canvas-confetti";

export const checkAndUpdateStreak = async (supabase: SupabaseClient, profileId: string, currentStreak: number, lastLoginDate: string | null, currentGems: number = 0) => {
  const today = new Date();
  // Get local date string YYYY-MM-DD
  const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  
  if (!lastLoginDate) {
    // First time login
    await supabase.from("profiles").update({ 
      current_streak: 1, 
      last_login_date: todayStr,
      gems: currentGems + 5
    }).eq("id", profileId);
    return 1;
  }

  if (lastLoginDate && lastLoginDate.split("T")[0] === todayStr) {
    // Same day login, no streak change
    return currentStreak;
  }

  const lastLogin = new Date(lastLoginDate);
  // Calculate difference based on UTC to avoid daylight saving issues since we only care about the date string
  const todayUTC = new Date(todayStr);
  const diffTime = Math.abs(todayUTC.getTime() - lastLogin.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays === 1) {
    // Consecutive day
    const newStreak = (currentStreak || 0) + 1;
    let bonusGems = 5;

    // Trigger confetti for streak milestone
    if (newStreak % 5 === 0) {
      triggerConfetti();
      bonusGems += 20; // Extra 20 gems for hitting a 5-day milestone
    }
    
    await supabase.from("profiles").update({ 
      current_streak: newStreak, 
      last_login_date: todayStr,
      gems: currentGems + bonusGems
    }).eq("id", profileId);
    
    return newStreak;
  } else if (diffDays > 1) {
    // Check for Streak Freeze
    const { data: freezeData } = await supabase
      .from("user_inventory")
      .select("id, quantity, shop_items!inner(name)")
      .eq("user_id", profileId)
      .eq("shop_items.name", "Streak Freeze")
      .single();

    if (freezeData && freezeData.quantity > 0) {
      // Consume 1 Streak Freeze
      await supabase.from("user_inventory").update({ quantity: freezeData.quantity - 1 }).eq("id", freezeData.id);
      
      // Save the streak, just update login date
      await supabase.from("profiles").update({ 
        last_login_date: todayStr,
        gems: currentGems + 5
      }).eq("id", profileId);
      
      return currentStreak;
    }

    // Streak broken
    await supabase.from("profiles").update({ 
      current_streak: 1, 
      last_login_date: todayStr,
      gems: currentGems + 5
    }).eq("id", profileId);
    return 1;
  }
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

export const generateDailyQuests = async (supabase: SupabaseClient, profileId: string, currentQuests: any[], lastQuestReset: string | null, currentXp: number = 0) => {
  const today = new Date();
  const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  
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
      xp: currentXp + 10 // Add 10 XP for login instead of resetting to 10
    }).eq("id", profileId);
    
    return newQuests;
  }
  
  return currentQuests || [];
};
