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
  
  // Auto-refund logic: if status is rejected and refund_requested_at is > 3 mins ago
  if (data.status === 'rejected' && data.refund_requested_at) {
    const requestedAt = new Date(data.refund_requested_at).getTime();
    const now = new Date().getTime();
    const threeMins = 3 * 60 * 1000;
    
    if (now - requestedAt >= threeMins) {
      // Update to refund_success
      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from("nia_transactions")
        .update({ status: 'refund_success', updated_at: new Date().toISOString() })
        .eq("invoice_id", invoiceId)
        .select(`*, student:student_id (full_name), package:package_id (name)`)
        .single();
        
      if (!updateError && updatedData) {
        return { success: true, data: updatedData };
      }
    }
  }

  return { success: true, data };
}

export async function submitRefundAction(invoiceId: string, bank: string, account: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin
    .from("nia_transactions")
    .update({ 
      refund_bank: bank,
      refund_account: account,
      refund_requested_at: new Date().toISOString()
    })
    .eq("invoice_id", invoiceId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
