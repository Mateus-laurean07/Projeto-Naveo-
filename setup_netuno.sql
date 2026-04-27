-- =========================================
-- SCRIPT DE INSTALAÇÃO: IA NETUNO
-- Execute isso no SQL Editor do Supabase
-- =========================================

-- Tabela de Sessões (Conversas)
CREATE TABLE IF NOT EXISTS public.netuno_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    current_step INTEGER DEFAULT 1,
    diario_bordo JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Mensagens do Chat
CREATE TABLE IF NOT EXISTS public.netuno_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES public.netuno_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Configurações Dinâmicas da IA (Prompt, etc)
CREATE TABLE IF NOT EXISTS public.netuno_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================
-- HABILITAR RLS (Segurança a Nível de Linha)
-- =========================================
ALTER TABLE public.netuno_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netuno_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.netuno_config ENABLE ROW LEVEL SECURITY;

-- =========================================
-- POLÍTICAS DA TABELA: netuno_sessions
-- =========================================
CREATE POLICY "Users can create their own sessions" ON public.netuno_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions" ON public.netuno_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.netuno_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.netuno_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- =========================================
-- POLÍTICAS DA TABELA: netuno_messages
-- =========================================
CREATE POLICY "Users can create messages for their sessions" ON public.netuno_messages
    FOR INSERT WITH CHECK (
        session_id IN (SELECT id FROM public.netuno_sessions WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can view messages of their sessions" ON public.netuno_messages
    FOR SELECT USING (
        session_id IN (SELECT id FROM public.netuno_sessions WHERE user_id = auth.uid())
    );

-- =========================================
-- POLÍTICAS DA TABELA: netuno_config
-- =========================================
CREATE POLICY "Everyone can view config" ON public.netuno_config
    FOR SELECT USING (true);

-- Permite que administradores gerenciem os prompts do sistema
CREATE POLICY "Admins can update config" ON public.netuno_config
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.profiles WHERE role = 'super_admin' OR role = 'admin')
    );

-- Trigger de Updated_at para Sessões
CREATE OR REPLACE FUNCTION update_netuno_sessions_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_netuno_sessions_update ON public.netuno_sessions;
CREATE TRIGGER trg_netuno_sessions_update
BEFORE UPDATE ON public.netuno_sessions
FOR EACH ROW
EXECUTE FUNCTION update_netuno_sessions_modtime();
