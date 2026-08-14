DROP POLICY IF EXISTS "Operators can manage all transactions" ON public.nia_transactions;

CREATE POLICY "Operators can manage all transactions"
    ON public.nia_transactions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('operator_les', 'admin', 'pengurus')
        )
    );
