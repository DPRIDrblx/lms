-- Add grades_summary to report_cards for Semester Reports
ALTER TABLE public.report_cards ADD COLUMN IF NOT EXISTS grades_summary JSONB DEFAULT '{}'::jsonb;
