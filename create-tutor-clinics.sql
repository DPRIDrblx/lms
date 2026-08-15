CREATE TABLE IF NOT EXISTS public.tutor_clinics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    branch_id UUID REFERENCES public.nia_branches(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    schedule_time TIME NOT NULL,
    student_count INTEGER NOT NULL DEFAULT 1,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    help_needed TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, completed
    clinic_plan TEXT,
    clinic_report TEXT,
    rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tutor_clinics ENABLE ROW LEVEL SECURITY;

-- Student Policy: Can insert their own bookings, read their own bookings, update rating
CREATE POLICY "Student can insert their own clinic" ON public.tutor_clinics
    FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Student can view their own clinic" ON public.tutor_clinics
    FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Student can update rating on completed clinic" ON public.tutor_clinics
    FOR UPDATE
    USING (auth.uid() = student_id AND status = 'completed')
    WITH CHECK (auth.uid() = student_id AND status = 'completed');

-- Tutor Policy: Can view assigned clinics, update plan, report, and status
CREATE POLICY "Tutor can view assigned clinic" ON public.tutor_clinics
    FOR SELECT
    USING (auth.uid() = tutor_id);

CREATE POLICY "Tutor can update assigned clinic" ON public.tutor_clinics
    FOR UPDATE
    USING (auth.uid() = tutor_id)
    WITH CHECK (auth.uid() = tutor_id);

-- Operator Policy: Can view all clinics, update status
CREATE POLICY "Operator can view all clinics" ON public.tutor_clinics
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'operator_les' OR role = 'super_admin' OR role = 'tu')
        )
    );

CREATE POLICY "Operator can update all clinics" ON public.tutor_clinics
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND (role = 'operator_les' OR role = 'super_admin' OR role = 'tu')
        )
    );
