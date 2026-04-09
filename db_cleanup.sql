-- SCRIPT DE LIMPEZA NAVEO - EXECUTE NO SQL EDITOR DO SUPABASE
-- Este script remove tabelas que não são mais utilizadas pelo site.

BEGIN;

-- 1. Remover tabelas obsoletas (se existirem)
-- Aviso: Isso apagará permanentemente os dados apenas destas tabelas antigas.
DROP TABLE IF EXISTS public.tarefas;
DROP TABLE IF EXISTS public.projetos;
DROP TABLE IF EXISTS public.clientes;
DROP TABLE IF EXISTS public.notifications;

-- 2. Garantir que as tabelas novas tenham as colunas de equipe corretas
-- (Verificação de segurança para não quebrar o código membro/admin)

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='admin_id') THEN
        ALTER TABLE public.profiles ADD COLUMN admin_id UUID REFERENCES public.profiles(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='nickname') THEN
        ALTER TABLE public.profiles ADD COLUMN nickname TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

COMMIT;

-- LOG
PRINT 'Limpeza concluída! Tabelas obsoletas removidas.';
