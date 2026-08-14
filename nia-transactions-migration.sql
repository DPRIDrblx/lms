-- nia-transactions-migration.sql
-- Create transactions table to handle payment approvals and history

CREATE TABLE IF NOT EXISTS public.nia_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    invoice_id TEXT UNIQUE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    package_id UUID REFERENCES public.nia_packages(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')) DEFAULT 'pending',
    promo_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for nia_transactions
ALTER TABLE public.nia_transactions ENABLE ROW LEVEL SECURITY;

-- Students can read their own transactions
CREATE POLICY "Users can view their own transactions" 
    ON public.nia_transactions FOR SELECT 
    USING (auth.uid() = student_id);

-- Operators can view and update all transactions
CREATE POLICY "Operators can manage all transactions"
    ON public.nia_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.role IN ('operator_les', 'super_admin')
        )
    );

-- Allow inserting for testing/system purposes
CREATE POLICY "System can insert transactions"
    ON public.nia_transactions FOR INSERT
    WITH CHECK (true);
