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
