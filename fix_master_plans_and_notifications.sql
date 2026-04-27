-- Central de Gestão Naveo - Fix Planos e Notificações
-- Execute no SQL Editor do Supabase

BEGIN;

-- 1. Adicionar colunas faltantes em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'Sem Plano';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT false;

-- 2. Criar a tabela sys_notifications (exigida pelo Header.tsx e outros componentes)
CREATE TABLE IF NOT EXISTS public.sys_notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID, -- ID do usuário (auth.uid()) que receberá a notificação
    type TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_tab TEXT,
    target_id TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Habilitar Realtime para sys_notifications
ALTER publication supabase_realtime ADD TABLE public.sys_notifications;

-- 4. Configurar RLS para sys_notifications
ALTER TABLE public.sys_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver suas próprias notificações" ON public.sys_notifications;
CREATE POLICY "Usuários podem ver suas próprias notificações"
ON public.sys_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Usuários podem atualizar suas notificações" ON public.sys_notifications;
CREATE POLICY "Usuários podem atualizar suas notificações"
ON public.sys_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema/Admins podem inserir notificações" ON public.sys_notifications;
CREATE POLICY "Sistema/Admins podem inserir notificações"
ON public.sys_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

COMMIT;
