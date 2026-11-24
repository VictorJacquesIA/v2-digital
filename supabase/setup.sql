-- Estrutura completa do banco (gerada a partir de drizzle/migrations, em ordem).
-- Projeto novo: cole tudo no SQL Editor e rode uma vez. Banco que já existe: rode só a migration nova.

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

-- ── 0005_crm_agencia.sql
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



-- ── 0006_nome_contato_diagnostico.sql
-- Nome de quem pede o diagnóstico gratuito.
-- O formulário passa a pedir "Seu nome"; ele vai para o lead e para a oportunidade do funil.
ALTER TABLE public.leads_diagnostico ADD COLUMN IF NOT EXISTS nome_contato text;

CREATE OR REPLACE FUNCTION public.crm_sincroniza_lead_diagnostico()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE op_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.crm_oportunidades (nome_empresa, nome_contato, whatsapp, origem, lead_diagnostico_id, maps_place_id)
    VALUES (coalesce(nullif(NEW.business_name, ''), 'Contato do diagnóstico'), nullif(NEW.nome_contato, ''), NEW.whatsapp, 'diagnostico', NEW.id, NEW.place_id)
    ON CONFLICT DO NOTHING;
    RETURN NEW;
  END IF;

  SELECT id INTO op_id FROM public.crm_oportunidades WHERE lead_diagnostico_id = NEW.id LIMIT 1;
  IF op_id IS NULL THEN RETURN NEW; END IF;

  -- O diagnóstico completa nome, contato e place_id depois de gravar o WhatsApp.
  -- O nome do contato só preenche quando está vazio: o que foi editado no CRM vale.
  UPDATE public.crm_oportunidades
  SET nome_empresa = CASE WHEN nome_empresa = 'Contato do diagnóstico' AND nullif(NEW.business_name, '') IS NOT NULL THEN NEW.business_name ELSE nome_empresa END,
      nome_contato = coalesce(nullif(nome_contato, ''), nullif(NEW.nome_contato, '')),
      maps_place_id = coalesce(maps_place_id, NEW.place_id)
  WHERE id = op_id
    AND (nome_empresa = 'Contato do diagnóstico'
         OR maps_place_id IS NULL
         OR (nullif(nome_contato, '') IS NULL AND nullif(NEW.nome_contato, '') IS NOT NULL));

  IF NEW.interacoes > OLD.interacoes THEN
    INSERT INTO public.crm_atividades (oportunidade_id, tipo, descricao, metadados)
    VALUES (op_id, 'nota', 'Pediu o diagnóstico de novo', jsonb_build_object('interacoes', NEW.interacoes));
  END IF;
  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RETURN NEW;  -- place_id já pertence a outra oportunidade: mantém o lead gravado
END $$;

DROP TRIGGER IF EXISTS crm_sincroniza_lead_diagnostico ON public.leads_diagnostico;
CREATE TRIGGER crm_sincroniza_lead_diagnostico
AFTER INSERT OR UPDATE OF business_name, nome_contato, place_id, interacoes ON public.leads_diagnostico
FOR EACH ROW EXECUTE FUNCTION public.crm_sincroniza_lead_diagnostico();

-- ── 0007_diagnostico_link_publico.sql
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
