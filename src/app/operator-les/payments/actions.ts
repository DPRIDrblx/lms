"use server";

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function rejectPaymentAction(transactionId: string, studentId: string, note: string) {
  try {
    // 1. Update the transaction status and notes
    const { error: txError } = await supabaseAdmin
      .from("nia_transactions")
      .update({ 
        status: "rejected", 
        notes: note || null,
        updated_at: new Date().toISOString() 
      })
      .eq("id", transactionId);
    
    if (txError) throw txError;

    // 2. Delete the user account from auth.users (cascades to profiles and subscriptions)
    if (studentId) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(studentId);
      if (deleteError) {
        console.error("Failed to delete user account:", deleteError);
        // We don't throw here because if the user was already deleted or doesn't exist,
        // we still want the transaction rejection to succeed.
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Reject Payment Error:", error);
    return { success: false, error: error.message };
  }
}
