-- CORREÇÃO DE RLS PARA ASSINATURAS v2 (EQUIPES)
-- Este script permite que tanto o DONO quanto os ADMINISTRADORES da equipe gerenciem a assinatura.

BEGIN;

-- 1. Remover polícias antigas
DROP POLICY IF EXISTS "Usuários podem ver sua própria assinatura" ON public.subscriptions;
DROP POLICY IF EXISTS "Usuários podem gerenciar sua própria assinatura" ON public.subscriptions;
DROP POLICY IF EXISTS "Gerenciar assinatura da conta" ON public.subscriptions;

-- 2. Criar nova política abrangente
CREATE POLICY "Gerenciar assinatura da conta" ON public.subscriptions
    FOR ALL
    TO authenticated
    USING (
        -- Caso 1: O usuário logado é o dono da assinatura
        auth.uid() = user_id 
        OR 
        -- Caso 2: O usuário logado é um admin da equipe cujo dono é o user_id da assinatura
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid() 
            AND (p.role = 'admin' OR p.role = 'super_admin')
            AND p.admin_id = (SELECT id FROM public.profiles WHERE user_id = subscriptions.user_id LIMIT 1)
        )
    )
    WITH CHECK (
        -- Mesma lógica para inserção/atualização
        auth.uid() = user_id 
        OR 
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid() 
            AND (p.role = 'admin' OR p.role = 'super_admin')
            AND p.admin_id = (SELECT id FROM public.profiles WHERE user_id = subscriptions.user_id LIMIT 1)
        )
    );

COMMIT;
