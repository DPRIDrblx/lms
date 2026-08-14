"use server";

import { createClient } from "@supabase/supabase-js";

export async function searchInvoiceAction(invoiceId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from("nia_transactions")
    .select(`
      *,
      student:student_id (full_name),
      package:package_id (name)
    `)
    .eq("invoice_id", invoiceId)
    .single();

  if (error || !data) return { success: false };
  return { success: true, data };
}
