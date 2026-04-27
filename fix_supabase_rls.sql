-- ========================================================
-- CORREÇÃO DEFINITIVA DE RLS (SUPER ADMIN)
-- Execute este script no SQL Editor do seu Dashbord Supabase:
-- https://supabase.com/dashboard/project/ihgpueepsmtsuzlcrkrs/sql
-- ========================================================

BEGIN;

-- 1. Garantir que a tabela subscriptions permite acesso total ao Super Admin
DROP POLICY IF EXISTS "Gerenciar assinatura da conta" ON public.subscriptions;
DROP POLICY IF EXISTS "Super Admins gerenciam tudo ou donos gerenciam seu próprio" ON public.subscriptions;

CREATE POLICY "Super Admins gerenciam tudo" ON public.subscriptions
    FOR ALL
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- 2. Garantir que perfis permitem leitura total ao Super Admin
DROP POLICY IF EXISTS "Ver perfis" ON public.profiles;

CREATE POLICY "Super Admins veem todos os perfis" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = user_id 
        OR 
        admin_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

-- 3. Atualizar perfis existentes que ficaram com o status errado (Opcional, mas recomendado)
-- Isso limpa os perfis que mostram "Sem Plano" mas que na verdade têm assinaturas canceladas.
UPDATE public.profiles p
SET plan_name = 'Cancelado', is_pro = false
FROM public.subscriptions s
WHERE p.id = s.user_id AND s.status = 'canceled';

COMMIT;
