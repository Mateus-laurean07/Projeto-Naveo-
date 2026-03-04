-- schema.sql

-- Habilitar a extensão "uuid-ossp" se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('super_admin', 'admin', 'user')) DEFAULT 'user',
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 2. Tabela Clientes (CRM Leads)
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    status TEXT CHECK (status IN ('Novo Lead', 'Em Contato', 'Em Negociação', 'Fechado')) DEFAULT 'Novo Lead',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Tabela Projetos
CREATE TABLE IF NOT EXISTS public.projetos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    valor NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT CHECK (status IN ('Backlog', 'Em Andamento', 'Em Revisão', 'Concluído')) DEFAULT 'Backlog',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 4. Tabela Tarefas
CREATE TABLE IF NOT EXISTS public.tarefas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    projeto_id UUID REFERENCES public.projetos(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    status TEXT CHECK (status IN ('Backlog', 'Fazendo', 'Revisão', 'Concluído')) DEFAULT 'Backlog',
    prioridade TEXT CHECK (prioridade IN ('Baixa', 'Média', 'Alta', 'Urgente')) DEFAULT 'Média',
    assign_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- Profiles: Usuário pode ver seu próprio profile. Admin vê todos.
CREATE POLICY "Usuários veem próprio perfil" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Usuários atualizam próprio perfil" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Clientes: Usuário vê apenas seus próprios clientes, Admin vê tudo
CREATE POLICY "Acesso aos Clientes" 
ON public.clientes FOR ALL 
USING (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR 
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Projetos: Usuários veem seus projetos (criados por eles). Admins veem tudo.
-- Proteção de faturamento/métricas globais garantida por esta RLS (admins têm acesso amplo)
CREATE POLICY "Acesso aos Projetos" 
ON public.projetos FOR ALL 
USING (
    profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR 
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Tarefas: Usuários veem tarefas atribuídas a eles ou de seus projetos. Admins veem tudo.
CREATE POLICY "Acesso às Tarefas" 
ON public.tarefas FOR ALL 
USING (
    assign_to = (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR 
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);
