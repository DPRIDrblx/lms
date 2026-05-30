-- Menambahkan kolom pengurus kelas tambahan ke tabel classes
ALTER TABLE public.classes 
ADD COLUMN IF NOT EXISTS secretary_1_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS secretary_2_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS treasurer_1_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS treasurer_2_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
