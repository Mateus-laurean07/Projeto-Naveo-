-- POPULAMENTO DE PLANOS (SEED)
-- Este script insere os planos que o frontend espera.

BEGIN;

-- Limpar planos antigos (se houver IDs errados)
-- DELETE FROM public.plans; 

-- Inserir os planos com os IDs UUID que estão no Checkout.tsx e Subscriptions.tsx
INSERT INTO public.plans (id, name, price, period, features, max_users)
VALUES 
(
    '00000000-0000-0000-0000-000000000002', 
    'Básico', 
    '297.90', 
    'mês', 
    ARRAY['50 máquinas', '1 usuários', 'IA ilimitada', 'Disparos ilimitados', 'Suporte por E-mail'],
    1
),
(
    '00000000-0000-0000-0000-000000000003', 
    'Profissional', 
    '647.90', 
    'mês', 
    ARRAY['200 máquinas', '2 usuários', '500 msg IA/mês', '1.000 disparos/mês', 'Suporte por E-mail'],
    2
),
(
    '00000000-0000-0000-0000-000000000004', 
    'Enterprise', 
    '1200.00', 
    'mês', 
    ARRAY['Máquinas ilimitadas', '3 usuários', '1000 msg IA/mês', 'Disparos ilimitados', 'Suporte por WhatsApp'],
    3
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    features = EXCLUDED.features,
    max_users = EXCLUDED.max_users;

COMMIT;
