-- Add columns for refund processing
ALTER TABLE public.nia_transactions
ADD COLUMN IF NOT EXISTS refund_bank TEXT,
ADD COLUMN IF NOT EXISTS refund_account TEXT,
ADD COLUMN IF NOT EXISTS refund_requested_at TIMESTAMPTZ;
