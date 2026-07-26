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
  phone?: string;
  schoolName?: string;
  parentName?: string;
  parentPhone?: string;
}) {
  try {
    const { name, email, password, packageId, phone, schoolName, parentName, parentPhone } = formData;

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
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Gagal membuat user");
    }

    const userId = authData.user.id;

    // 2. Ensure role and new fields in profiles table
    await supabaseAdmin.from("profiles").update({
      full_name: name,
      role: "sobat_nia",
      phone: phone || null,
      school_name: schoolName || null,
      parent_name: parentName || null,
      parent_phone: parentPhone || null
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
