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