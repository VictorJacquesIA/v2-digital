-- CRM de agência: oportunidades unificadas, histórico, tarefas, fila da IA e metas.
-- Acesso só para admin (has_role). Visitantes continuam gravando apenas em leads_diagnostico,
-- e um gatilho cria a oportunidade correspondente.

-- ── Oportunidades (tabela central do funil) ─────────────────────────────
CREATE TABLE public.crm_oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_empresa text NOT NULL,
  nome_contato text,
  whatsapp text,
  -- Só dígitos, sem o 55 do país: chave de deduplicação entre origens
  whatsapp_norm text GENERATED ALWAYS AS (
    CASE
      WHEN regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g') ~ '^55\d{10,11}$'
        THEN substr(regexp_replace(whatsapp, '\D', '', 'g'), 3)
      ELSE nullif(regexp_replace(coalesce(whatsapp, ''), '\D', '', 'g'), '')
    END
  ) STORED,
  nicho text,
  regiao text,
  origem text NOT NULL DEFAULT 'manual'
    CONSTRAINT crm_origem_ok CHECK (origem IN ('diagnostico', 'maps', 'whatsapp', 'indicacao', 'manual')),
  etapa text NOT NULL DEFAULT 'novo'
    CONSTRAINT crm_etapa_ok CHECK (etapa IN ('novo', 'contatado', 'diagnostico_enviado', 'proposta', 'negociacao', 'fechado', 'perdido')),
  valor_mensal numeric(12, 2) NOT NULL DEFAULT 0 CONSTRAINT crm_valor_ok CHECK (valor_mensal >= 0),
  servicos_interesse text[] NOT NULL DEFAULT '{}',
  motivo_perda text,
  score_oportunidade integer NOT NULL DEFAULT 0 CONSTRAINT crm_score_ok CHECK (score_oportunidade BETWEEN 0 AND 100),
  etapa_desde timestamptz NOT NULL DEFAULT now(),
  fechado_em timestamptz,
  lead_diagnostico_id uuid REFERENCES public.leads_diagnostico(id) ON DELETE SET NULL,
  maps_place_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX crm_oportunidades_whatsapp_uniq ON public.crm_oportunidades (whatsapp_norm) WHERE whatsapp_norm IS NOT NULL;
CREATE UNIQUE INDEX crm_oportunidades_place_uniq ON public.crm_oportunidades (maps_place_id) WHERE maps_place_id IS NOT NULL;
CREATE INDEX crm_oportunidades_etapa_idx ON public.crm_oportunidades (etapa);

-- ── Linha do tempo ──────────────────────────────────────────────────────
CREATE TABLE public.crm_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES public.crm_oportunidades(id) ON DELETE CASCADE,
  tipo text NOT NULL
    CONSTRAINT crm_atividade_tipo_ok CHECK (tipo IN ('mudanca_etapa', 'nota', 'mensagem_enviada', 'tarefa_concluida', 'sugestao_ia_aceita')),
  descricao text NOT NULL,
  metadados jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_atividades_op_idx ON public.crm_atividades (oportunidade_id, created_at DESC);

-- ── Tarefas e follow-ups ────────────────────────────────────────────────
CREATE TABLE public.crm_tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES public.crm_oportunidades(id) ON DELETE CASCADE,
  tipo text NOT NULL
    CONSTRAINT crm_tarefa_tipo_ok CHECK (tipo IN ('whatsapp', 'ligacao', 'reuniao', 'proposta', 'followup')),
  descricao text NOT NULL,
  vence_em timestamptz NOT NULL,
  concluida_em timestamptz,
  criada_por_ia boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_tarefas_pendentes_idx ON public.crm_tarefas (vence_em) WHERE concluida_em IS NULL;

-- ── Fila de sugestões da IA (nada é enviado sem aprovação) ──────────────
CREATE TABLE public.crm_sugestoes_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id uuid NOT NULL REFERENCES public.crm_oportunidades(id) ON DELETE CASCADE,
  papel text NOT NULL CONSTRAINT crm_sugestao_papel_ok CHECK (papel IN ('sdr', 'followup', 'comercial', 'analista')),
  acao text NOT NULL
    CONSTRAINT crm_sugestao_acao_ok CHECK (acao IN ('enviar_whatsapp', 'agendar_tarefa', 'mover_etapa', 'proposta_rascunho')),
  conteudo jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pendente' CONSTRAINT crm_sugestao_status_ok CHECK (status IN ('pendente', 'aprovada', 'descartada')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX crm_sugestoes_pendentes_idx ON public.crm_sugestoes_ia (created_at) WHERE status = 'pendente';

-- ── Metas mensais ───────────────────────────────────────────────────────
CREATE TABLE public.crm_metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes text NOT NULL UNIQUE CONSTRAINT crm_meta_mes_ok CHECK (mes ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  meta_novos integer NOT NULL DEFAULT 0,
  meta_propostas integer NOT NULL DEFAULT 0,
  meta_fechados integer NOT NULL DEFAULT 0,
  meta_receita numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Permissões: só admin ────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['crm_oportunidades', 'crm_atividades', 'crm_tarefas', 'crm_sugestoes_ia', 'crm_metas'] LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "Admin gerencia %s" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin'')) WITH CHECK (public.has_role(auth.uid(), ''admin''))',
      t, t);
  END LOOP;
END $$;

-- ── Gatilhos do funil ───────────────────────────────────────────────────
-- Mantém updated_at, etapa_desde e fechado_em coerentes com a etapa.
CREATE OR REPLACE FUNCTION public.crm_oportunidade_antes_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.etapa IS DISTINCT FROM OLD.etapa THEN
    NEW.etapa_desde := now();
    NEW.fechado_em := CASE WHEN NEW.etapa = 'fechado' THEN now() ELSE NULL END;
    IF NEW.etapa <> 'perdido' THEN NEW.motivo_perda := NULL; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER crm_oportunidade_antes_update
BEFORE UPDATE ON public.crm_oportunidades
FOR EACH ROW EXECUTE FUNCTION public.crm_oportunidade_antes_update();

-- Registra a mudança de etapa na linha do tempo e espelha no status do lead do diagnóstico.
CREATE OR REPLACE FUNCTION public.crm_oportunidade_depois_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.etapa IS DISTINCT FROM OLD.etapa THEN
    INSERT INTO public.crm_atividades (oportunidade_id, tipo, descricao, metadados)
    VALUES (NEW.id, 'mudanca_etapa', 'Etapa alterada', jsonb_build_object('de', OLD.etapa, 'para', NEW.etapa, 'motivo_perda', NEW.motivo_perda));

    IF NEW.lead_diagnostico_id IS NOT NULL THEN
      UPDATE public.leads_diagnostico
      SET status = CASE NEW.etapa
            WHEN 'novo' THEN 'novo'
            WHEN 'fechado' THEN 'cliente'
            WHEN 'perdido' THEN 'arquivado'
            WHEN 'proposta' THEN 'proposta'
            WHEN 'negociacao' THEN 'proposta'
            ELSE 'contatado'
          END,
          atendido = NEW.etapa <> 'novo'
      WHERE id = NEW.lead_diagnostico_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER crm_oportunidade_depois_update
AFTER UPDATE ON public.crm_oportunidades
FOR EACH ROW EXECUTE FUNCTION public.crm_oportunidade_depois_update();

CREATE OR REPLACE FUNCTION public.crm_oportunidade_depois_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.crm_atividades (oportunidade_id, tipo, descricao, metadados)
  VALUES (NEW.id, 'nota', 'Oportunidade criada', jsonb_build_object('origem', NEW.origem));
  RETURN NEW;
END $$;
CREATE TRIGGER crm_oportunidade_depois_insert
AFTER INSERT ON public.crm_oportunidades
FOR EACH ROW EXECUTE FUNCTION public.crm_oportunidade_depois_insert();

-- Novo pedido de diagnóstico vira oportunidade (sem duplicar o mesmo WhatsApp ou negócio).
-- SECURITY DEFINER: quem grava o lead é o visitante anônimo, sem acesso ao CRM.
CREATE OR REPLACE FUNCTION public.crm_sincroniza_lead_diagnostico()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE op_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.crm_oportunidades (nome_empresa, whatsapp, origem, lead_diagnostico_id, maps_place_id)
    VALUES (coalesce(nullif(NEW.business_name, ''), 'Contato do diagnóstico'), NEW.whatsapp, 'diagnostico', NEW.id, NEW.place_id)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  SELECT id INTO op_id FROM public.crm_oportunidades WHERE lead_diagnostico_id = NEW.id LIMIT 1;
  IF op_id IS NULL THEN RETURN NEW; END IF;

  -- O diagnóstico completa nome e place_id depois de gravar o WhatsApp
  UPDATE public.crm_oportunidades
  SET nome_empresa = CASE WHEN nome_empresa = 'Contato do diagnóstico' AND nullif(NEW.business_name, '') IS NOT NULL THEN NEW.business_name ELSE nome_empresa END,
      maps_place_id = coalesce(maps_place_id, NEW.place_id)
  WHERE id = op_id
    AND (nome_empresa = 'Contato do diagnóstico' OR maps_place_id IS NULL);

  IF NEW.interacoes > OLD.interacoes THEN
    INSERT INTO public.crm_atividades (oportunidade_id, tipo, descricao, metadados)
    VALUES (op_id, 'nota', 'Pediu o diagnóstico de novo', jsonb_build_object('interacoes', NEW.interacoes));
  END IF;
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RETURN NEW;  -- place_id já pertence a outra oportunidade: mantém o lead gravado
END $$;
CREATE TRIGGER crm_sincroniza_lead_diagnostico
AFTER INSERT OR UPDATE OF business_name, place_id, interacoes ON public.leads_diagnostico
FOR EACH ROW EXECUTE FUNCTION public.crm_sincroniza_lead_diagnostico();

-- ── Backfill dos contatos do diagnóstico ────────────────────────────────
-- Do mais recente para o mais antigo: em WhatsApp repetido, fica a interação mais nova.
INSERT INTO public.crm_oportunidades
  (nome_empresa, whatsapp, origem, etapa, motivo_perda, lead_diagnostico_id, maps_place_id, etapa_desde, fechado_em, created_at)
SELECT
  coalesce(nullif(l.business_name, ''), 'Contato do diagnóstico'),
  l.whatsapp,
  'diagnostico',
  CASE l.status WHEN 'cliente' THEN 'fechado' WHEN 'arquivado' THEN 'perdido' ELSE l.status END,
  CASE WHEN l.status = 'arquivado' THEN 'Arquivado no painel de diagnóstico' END,
  l.id,
  l.place_id,
  l.ultima_interacao,
  CASE WHEN l.status = 'cliente' THEN l.ultima_interacao END,
  l.created_at
FROM public.leads_diagnostico l
ORDER BY l.ultima_interacao DESC
ON CONFLICT DO NOTHING;

-- Notas antigas entram na linha do tempo
INSERT INTO public.crm_atividades (oportunidade_id, tipo, descricao, metadados, created_at)
SELECT o.id, 'nota', l.notas, jsonb_build_object('fonte', 'painel_diagnostico'), l.ultima_interacao
FROM public.leads_diagnostico l
JOIN public.crm_oportunidades o ON o.lead_diagnostico_id = l.id
WHERE nullif(trim(l.notas), '') IS NOT NULL;
