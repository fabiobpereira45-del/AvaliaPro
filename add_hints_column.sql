-- Add 'hints' column to 'challenges' table to store the tips given by the AI
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS hints TEXT[] DEFAULT '{}';
