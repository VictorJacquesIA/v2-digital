-- Link público do diagnóstico rápido: o dono guarda, compartilha e salva em PDF.
-- Um token por contato, criado sozinho ao gravar o lead (as linhas antigas ganham o seu).
ALTER TABLE public.leads_diagnostico
  ADD COLUMN IF NOT EXISTS diagnostico_token text UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', '');

-- Leitura pública só pelo token: devolve o relatório (dados públicos do Google), nunca o WhatsApp.
CREATE OR REPLACE FUNCTION public.diagnostico_publico(_token text)
RETURNS TABLE (business_name text, dados jsonb, atualizado timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.business_name, l.dados, l.ultima_interacao
  FROM public.leads_diagnostico l
  WHERE _token IS NOT NULL AND length(_token) >= 20 AND l.diagnostico_token = _token AND l.dados IS NOT NULL
  LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.diagnostico_publico(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.diagnostico_publico(text) TO anon, authenticated, service_role;
