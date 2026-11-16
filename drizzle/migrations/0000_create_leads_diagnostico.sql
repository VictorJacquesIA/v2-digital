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