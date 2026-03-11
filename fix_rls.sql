DROP POLICY IF EXISTS "Usuários veem próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários veem equipe" ON public.profiles;

CREATE POLICY "Usuários veem equipe" 
ON public.profiles FOR SELECT 
USING (
    auth.uid() = user_id 
    OR 
    (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1) IN ('super_admin', 'admin')
    OR
    (
        admin_id IS NOT NULL 
        AND admin_id = (SELECT admin_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    )
    OR
    id = (SELECT admin_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
    OR
    admin_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
);
