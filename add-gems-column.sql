-- Migration to add 'gems' column to 'profiles' table

ALTER TABLE public.profiles
ADD COLUMN gems INTEGER DEFAULT 0 NOT NULL;
