CREATE TABLE public.diagnosticos_cache (
  place_id text PRIMARY KEY,
  relatorio jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.diagnosticos_cache TO service_role;
ALTER TABLE public.diagnosticos_cache ENABLE ROW LEVEL SECURITY;