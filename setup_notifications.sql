CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários veem suas notificações" ON public.notifications;
CREATE POLICY "Usuários veem suas notificações" 
ON public.notifications FOR SELECT 
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Usuários atualizam suas notificações" ON public.notifications;
CREATE POLICY "Usuários atualizam suas notificações" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Sistema insere notificações" ON public.notifications;
CREATE POLICY "Sistema insere notificações" 
ON public.notifications FOR INSERT 
WITH CHECK (true);
