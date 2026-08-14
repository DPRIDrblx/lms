-- Fix foreign key constraint to prevent deleting transaction when user is deleted
ALTER TABLE public.nia_transactions
DROP CONSTRAINT IF EXISTS nia_transactions_student_id_fkey,
ADD CONSTRAINT nia_transactions_student_id_fkey
FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
