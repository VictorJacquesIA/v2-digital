-- Estrutura completa do banco (gerada a partir de drizzle/migrations, em ordem).
-- Cole no SQL Editor de um projeto Supabase novo e clique em Run, uma única vez.

-- ── 0000_create_leads_diagnostico.sql
CREATE TABLE public.leads_diagnostico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  whatsapp TEXT NOT NULL,
  maps_url TEXT,
  business_name TEXT,
  indice INTEGER,
  posicao TEXT,
  resumo TEXT
);

GRANT INSERT ON public.leads_diagnostico TO anon;
GRANT INSERT ON public.leads_diagnostico TO authenticated;
GRANT ALL ON public.leads_diagnostico TO service_role;

ALTER TABLE public.leads_diagnostico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visitantes podem enviar seu contato"
ON public.leads_diagnostico
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ── 0001_painel_leads_admin.sql
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuário vê seus papéis" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.grant_owner_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'victorjbinello@gmail.com' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_owner_admin
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_owner_admin();

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'victorjbinello@gmail.com' AND email_confirmed_at IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.leads_diagnostico ADD COLUMN atendido boolean NOT NULL DEFAULT false;
GRANT SELECT, UPDATE ON public.leads_diagnostico TO authenticated;
CREATE POLICY "Admin vê contatos" ON public.leads_diagnostico FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin atualiza contatos" ON public.leads_diagnostico FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 0002_diagnosticos_cache.sql
CREATE TABLE public.diagnosticos_cache (
  place_id text PRIMARY KEY,
  relatorio jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.diagnosticos_cache TO service_role;
ALTER TABLE public.diagnosticos_cache ENABLE ROW LEVEL SECURITY;

-- ── 0003_crm_leads.sql
ALTER TABLE public.leads_diagnostico
  ADD COLUMN status text NOT NULL DEFAULT 'novo',
  ADD COLUMN notas text,
  ADD COLUMN interacoes integer NOT NULL DEFAULT 1,
  ADD COLUMN ultima_interacao timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN place_id text,
  ADD COLUMN dados jsonb,
  ADD COLUMN estrategia jsonb;
UPDATE public.leads_diagnostico SET ultima_interacao = created_at, status = CASE WHEN atendido THEN 'contatado' ELSE 'novo' END;
ALTER TABLE public.leads_diagnostico ADD CONSTRAINT leads_status_ok CHECK (status IN ('novo','contatado','proposta','cliente','arquivado'));
CREATE INDEX leads_diagnostico_whatsapp_idx ON public.leads_diagnostico (whatsapp);
CREATE INDEX leads_diagnostico_place_idx ON public.leads_diagnostico (place_id);

-- ── 0004_estrategia_link_cliente.sql
ALTER TABLE public.leads_diagnostico
  ADD COLUMN estrategia_token text UNIQUE,
  ADD COLUMN estrategia_expira timestamptz;

CREATE OR REPLACE FUNCTION public.estrategia_publica(_token text)
RETURNS TABLE (business_name text, estrategia jsonb, expira timestamptz, expirada boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.business_name,
         CASE WHEN l.estrategia_expira > now() THEN l.estrategia ELSE NULL END,
         l.estrategia_expira,
         NOT (l.estrategia_expira > now())
  FROM public.leads_diagnostico l
  WHERE _token IS NOT NULL AND length(_token) >= 20 AND l.estrategia_token = _token
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.estrategia_publica(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.estrategia_publica(text) TO anon, authenticated, service_role;

