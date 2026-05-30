"use server";

import { createClient } from "@supabase/supabase-js";

export async function processPayment(billId: string, paymentMethod: string) {
  // Use service role key to bypass RLS for payment processing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabaseAdmin
    .from("finance_bills")
    .update({
      status: "paid",
      payment_method: paymentMethod,
      transaction_id: `TRX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      paid_at: new Date().toISOString(),
    })
    .eq("id", billId)
    .select();

  if (error) {
    throw new Error(error.message);
  }
  
  if (!data || data.length === 0) {
    throw new Error("Bill not found");
  }

  return data[0];
}
