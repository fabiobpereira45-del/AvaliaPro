-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discipline_id UUID REFERENCES public.disciplines(id) ON DELETE CASCADE,
    week INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    correct_answer TEXT,
    points_xp INTEGER NOT NULL DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create challenge_submissions table
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
    student_email TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    earned_xp INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up RLS for challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.challenges FOR ALL USING (auth.role() = 'authenticated');

-- Set up RLS for challenge_submissions
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for all users" ON public.challenge_submissions FOR ALL USING (true);

-- Inform PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
