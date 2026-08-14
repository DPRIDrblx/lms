-- Add program_type to nia_packages

ALTER TABLE public.nia_packages 
ADD COLUMN IF NOT EXISTS program_type VARCHAR(20) DEFAULT 'Reguler';

-- Update all existing packages to 'Reguler' by default
UPDATE public.nia_packages SET program_type = 'Reguler' WHERE program_type IS NULL;
