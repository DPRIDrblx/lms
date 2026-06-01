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

export async function registerSobatNiaAction(formData: {
  name: string;
  email: string;
  password: string;
  packageId: string;
}) {
  try {
    const { name, email, password, packageId } = formData;

    // 1. Create user using admin API (bypasses rate limits and auto-confirms email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: "sobat_nia"
      }
    });

    if (authError) {
      // If user already exists, we could just assign the subscription
      // but let's throw for now to keep it simple, unless it's just a rate limit.
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Gagal membuat user");
    }

    const userId = authData.user.id;

    // 2. Ensure role in profiles table
    await supabaseAdmin.from("profiles").update({
      full_name: name,
      role: "sobat_nia"
    }).eq("id", userId);

    // 3. Add subscription
    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1); // 1 year

    const { error: subError } = await supabaseAdmin.from("nia_subscriptions").insert({
      student_id: userId,
      package_id: packageId,
      status: "active",
      valid_until: validUntil.toISOString()
    });

    if (subError) throw subError;

    return { success: true, userId };
  } catch (error: any) {
    console.error("Signup Action Error:", error);
    return { success: false, error: error.message };
  }
}
