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