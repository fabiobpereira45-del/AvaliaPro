-- 🛡️ CORREÇÃO DE SEGURANÇA (RLS) - GESTÃO DE PROVAS
-- Execute este script no SQL Editor do Supabase para permitir que professores salvem provas.

-- 1. Garantir que o RLS está ativo (caso tenha sido desativado)
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas restritivas que podem estar bloqueando o acesso
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.assessments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.questions;
DROP POLICY IF EXISTS "anon_all_assessments" ON public.assessments;
DROP POLICY IF EXISTS "anon_all_questions" ON public.questions;

-- 3. Criar novas políticas permitindo acesso total (Leitura, Inserção, Atualização e Exclusão)
-- Isso é necessário porque o app atual utiliza a chave anon para operações de professor.

-- Política para PROVAS
CREATE POLICY "anon_all_assessments" ON public.assessments 
FOR ALL USING (true) WITH CHECK (true);

-- Política para QUESTÕES (caso precise salvar novas questões durante a criação da prova)
CREATE POLICY "anon_all_questions" ON public.questions 
FOR ALL USING (true) WITH CHECK (true);

-- 4. Aplicar também para outras tabelas que podem ter sido afetadas por scripts de "Base Nova"
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.disciplines;
DROP POLICY IF EXISTS "anon_all_disciplines" ON public.disciplines;
CREATE POLICY "anon_all_disciplines" ON public.disciplines FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.semesters;
DROP POLICY IF EXISTS "anon_all_semesters" ON public.semesters;
CREATE POLICY "anon_all_semesters" ON public.semesters FOR ALL USING (true) WITH CHECK (true);
