
-- Criar a tabela de pagamentos (payments) para persistência real no dashboard financeiro
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    subscription_id UUID, -- Opcional, para vincular a uma assinatura específica
    plan_name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    status TEXT CHECK (status IN ('pago', 'inadimplente', 'pendente')) DEFAULT 'pendente',
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Habilitar RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para pagamentos
-- Super Admin vê e edita tudo
CREATE POLICY "Super Admins can do everything on payments"
ON public.payments FOR ALL
USING (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'
);

-- Admins vêm pagamentos de seus clientes
CREATE POLICY "Admins can view their customers' payments"
ON public.payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = payments.customer_id
        AND c.user_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
    OR
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'super_admin'
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
