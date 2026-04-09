-- Central de Gestão Naveo - Schema Oficial v2.0
-- Este arquivo reflete a estrutura EXATA em uso pelo código da aplicação.

-- Habilitar a extensão "uuid-ossp" se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- 1. ESTRUTURA DE USUÁRIOS E PERFIS
-- =========================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('super_admin', 'admin', 'user')) DEFAULT 'user',
    full_name TEXT,
    nickname TEXT,
    avatar_url TEXT,
    admin_id UUID REFERENCES public.profiles(id), -- Dono da equipe (para membros)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================
-- 2. CRM E CLIENTES
-- =========================================

-- Leads (Oportunidades no CRM)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    company TEXT,
    value TEXT DEFAULT 'R$ 0',
    stage TEXT CHECK (stage IN ('Novo Lead', 'Em Contato', 'Em Negociação', 'Fechado')) DEFAULT 'Novo Lead',
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    email TEXT,
    phone TEXT,
    project_interest TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Customers (Clientes Ativos/Base de Dados)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT CHECK (status IN ('Ativo', 'Inativo')) DEFAULT 'Ativo',
    company TEXT,
    document TEXT,
    asaas_id TEXT,
    cep TEXT,
    address TEXT,
    address_number TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================
-- 3. GESTÃO DE PROJETOS E TAREFAS
-- =========================================

-- Tasks (Atua como a tabela de PROJETOS no sistema)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Project Tasks (As tarefas reais dentro de cada projeto)
CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'A fazer',
    priority TEXT DEFAULT 'Média',
    start_date DATE,
    due_date DATE,
    completed BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    tags JSONB DEFAULT '[]',
    comments_data JSONB DEFAULT '[]',
    attachments JSONB DEFAULT '[]',
    assigned_to UUID[] DEFAULT '{}',
    cover_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================
-- 4. FINANCEIRO E ASSINATURAS
-- =========================================

-- Plans
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY, -- 'standard', 'pro', 'enterprise'
    name TEXT NOT NULL,
    price TEXT NOT NULL,
    period TEXT NOT NULL,
    features TEXT[] DEFAULT '{}',
    max_users INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES public.plans(id),
    status TEXT DEFAULT 'active',
    renewal_date TIMESTAMP WITH TIME ZONE,
    trial_ends TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Payments (Movimentações financeiras)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
    due_date DATE NOT NULL,
    description TEXT,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- =========================================
-- 5. EQUIPE E CONVITES
-- =========================================

CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    token TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES public.profiles(id),
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- =========================================
-- 6. POLÍTICAS RLS (RESUMO)
-- =========================================

-- Habilitar RLS em tudo
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Note: As políticas específicas de cada tabela devem garantir que
-- membros da equipe (admin_id) e donos (user_id) acessem os mesmos dados.
