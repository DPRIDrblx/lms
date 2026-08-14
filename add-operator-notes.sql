-- Add notes column to nia_transactions to store operator comments
ALTER TABLE public.nia_transactions
ADD COLUMN IF NOT EXISTS notes TEXT;
