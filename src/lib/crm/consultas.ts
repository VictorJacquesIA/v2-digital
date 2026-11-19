/* Consultas do CRM ao Supabase (cliente do navegador, protegido por RLS de admin). */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Oportunidade } from "./funil";
import type { Tarefa, TipoTarefa } from "./agenda";

export const CHAVE_OPS = ["crm-oportunidades"] as const;
export const CHAVE_TAREFAS = ["crm-tarefas"] as const;
export const chaveAtividades = (id: string) => ["crm-atividades", id] as const;

const COLUNAS_OP =
  "id, nome_empresa, nome_contato, whatsapp, nicho, regiao, origem, etapa, valor_mensal, servicos_interesse, motivo_perda, score_oportunidade, etapa_desde, fechado_em, lead_diagnostico_id, created_at";

export function useOportunidades() {
  return useQuery({
    queryKey: CHAVE_OPS,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_oportunidades").select(COLUNAS_OP);
      if (error) throw error;
      return data as Oportunidade[];
    },
  });
}

/** Tarefas pendentes + concluídas nos últimos 14 dias (para desfazer engano recente). */
export function useTarefas() {
  return useQuery({
    queryKey: CHAVE_TAREFAS,
    queryFn: async () => {
      const desde = new Date(Date.now() - 14 * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from("crm_tarefas")
        .select("id, oportunidade_id, tipo, descricao, vence_em, concluida_em, criada_por_ia")
        .or(`concluida_em.is.null,concluida_em.gte.${desde}`)
        .order("vence_em");
      if (error) throw error;
      return data as Tarefa[];
    },
  });
}

export function useCriarTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: { oportunidade_id: string; tipo: TipoTarefa; descricao: string; vence_em: Date }) => {
      const { error } = await supabase
        .from("crm_tarefas")
        .insert({ oportunidade_id: t.oportunidade_id, tipo: t.tipo, descricao: t.descricao.trim(), vence_em: t.vence_em.toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE_TAREFAS }),
  });
}

/** Marca ou desmarca a conclusão; concluir também entra no histórico da oportunidade. */
export function useConcluirTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tarefa, concluir }: { tarefa: Tarefa; concluir: boolean }) => {
      const concluida_em = concluir ? new Date().toISOString() : null;
      const { error } = await supabase.from("crm_tarefas").update({ concluida_em }).eq("id", tarefa.id);
      if (error) throw error;
      if (concluir) {
        await supabase.from("crm_atividades").insert({
          oportunidade_id: tarefa.oportunidade_id,
          tipo: "tarefa_concluida",
          descricao: tarefa.descricao,
          metadados: { tarefa_id: tarefa.id, tipo: tarefa.tipo },
        });
      }
    },
    onMutate: async ({ tarefa, concluir }) => {
      await qc.cancelQueries({ queryKey: CHAVE_TAREFAS });
      const antes = qc.getQueryData<Tarefa[]>(CHAVE_TAREFAS);
      qc.setQueryData<Tarefa[]>(CHAVE_TAREFAS, (ts) =>
        ts?.map((t) => (t.id === tarefa.id ? { ...t, concluida_em: concluir ? new Date().toISOString() : null } : t)),
      );
      return { antes };
    },
    onError: (_e, _v, ctx) => ctx?.antes && qc.setQueryData(CHAVE_TAREFAS, ctx.antes),
    onSettled: (_d, _e, { tarefa }) => {
      qc.invalidateQueries({ queryKey: CHAVE_TAREFAS });
      qc.invalidateQueries({ queryKey: chaveAtividades(tarefa.oportunidade_id) });
    },
  });
}
