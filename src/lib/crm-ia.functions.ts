/*
 * Copiloto do CRM: a IA prepara mensagens e rascunhos e grava na fila
 * crm_sugestoes_ia. Nada é enviado daqui: o Victor aprova cada item no painel.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database, Json } from "@/integrations/supabase/types";
import { MASK_LISTA, google, listar } from "./google-places";
import { erroDeIa } from "./gemini";
import { filaFollowup, metricasSemana, qualificarPorMaps, type DadosMaps, type MetricasSemana } from "./crm/copiloto";
import { analiseSemanal, mensagensFollowup, mensagensSdr, rascunhoProposta } from "./crm/copiloto-ia";
import { normalizarWhatsapp, rotuloEtapa, type Oportunidade } from "./crm/funil";

type Ctx = { supabase: SupabaseClient<Database>; userId: string };
type Falha = { ok: false; erro: string };

async function ehAdmin(ctx: Ctx) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  return !!data;
}
const SEM_ACESSO: Falha = { ok: false, erro: "Sem acesso." };

const COLUNAS_OP =
  "id, nome_empresa, nome_contato, whatsapp, nicho, regiao, origem, etapa, valor_mensal, servicos_interesse, motivo_perda, score_oportunidade, etapa_desde, fechado_em, lead_diagnostico_id, created_at";

async function gravarSugestoes(ctx: Ctx, papel: string, acao: string, linhas: Array<{ oportunidade_id: string; conteudo: Record<string, unknown> }>) {
  if (!linhas.length) return 0;
  const { error } = await ctx.supabase.from("crm_sugestoes_ia").insert(linhas.map((l) => ({ ...l, papel, acao, conteudo: l.conteudo as Json })));
  if (error) throw error;
  return linhas.length;
}

/** Sinais do Google e nota do diagnóstico, quando a oportunidade veio dele. */
async function dadosDoDiagnostico(ctx: Ctx, leadId: string | null) {
  if (!leadId) return null;
  const { data: lead } = await ctx.supabase.from("leads_diagnostico").select("dados, indice, posicao, resumo").eq("id", leadId).maybeSingle();
  if (!lead) return null;
  return {
    nota: lead.indice,
    posicao: lead.posicao,
    resumo: lead.resumo,
    sinais: lead.dados ? qualificarPorMaps(lead.dados as DadosMaps).motivos : [],
  };
}

/* ── SDR: primeira mensagem de uma oportunidade do funil ───────────── */

export const sdrPrimeiraMensagem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { oportunidadeId: string }) => ({ oportunidadeId: String(d?.oportunidadeId ?? "") }))
  .handler(async ({ data, context }): Promise<{ ok: true } | Falha> => {
    if (!(await ehAdmin(context))) return SEM_ACESSO;
    const { data: op } = await context.supabase.from("crm_oportunidades").select(COLUNAS_OP).eq("id", data.oportunidadeId).maybeSingle();
    if (!op) return { ok: false, erro: "Oportunidade não encontrada." };
    if (!op.whatsapp) return { ok: false, erro: "Cadastre o WhatsApp antes de pedir a mensagem." };

    const diag = await dadosDoDiagnostico(context, op.lead_diagnostico_id);
    const sinais = [...(diag?.sinais ?? []), ...(diag?.nota != null ? [`Pediu o diagnóstico gratuito da V2 e tirou nota ${diag.nota}/100`] : [])];
    try {
      const [m] = await mensagensSdr([{ id: op.id, empresa: op.nome_empresa, nicho: op.nicho, regiao: op.regiao, contato: op.nome_contato, sinais }]);
      if (!m) return { ok: false, erro: "A IA não devolveu mensagem. Tente de novo." };
      await gravarSugestoes(context, "sdr", "enviar_whatsapp", [{ oportunidade_id: op.id, conteudo: { mensagem: m.mensagem, justificativa: m.justificativa } }]);
      return { ok: true };
    } catch (e) {
      console.error("SDR falhou:", e);
      return { ok: false, erro: erroDeIa(e) };
    }
  });

/* ── SDR: prospecção no Google Maps ───────────────────────────────── */

export type Prospecto = {
  place_id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  site: string | null;
  nota: number | null;
  avaliacoes: number;
  categoria: string | null;
  score: number;
  faixa: "alta" | "media" | "baixa";
  motivos: string[];
  jaNoCrm: boolean;
};

export const prospectarMaps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { nicho: string; regiao: string }) => ({ nicho: String(d?.nicho ?? "").trim().slice(0, 80), regiao: String(d?.regiao ?? "").trim().slice(0, 80) }))
  .handler(async ({ data, context }): Promise<{ ok: true; prospectos: Prospecto[] } | Falha> => {
    if (!(await ehAdmin(context))) return SEM_ACESSO;
    if (!data.nicho || !data.regiao) return { ok: false, erro: "Informe o nicho e a região." };
    let places;
    try {
      const json = await google("/v1/places:searchText", "POST", MASK_LISTA, {
        textQuery: `${data.nicho} em ${data.regiao}`,
        languageCode: "pt-BR",
        regionCode: "BR",
        maxResultCount: 20,
      });
      places = listar(json).filter((p) => p.id && p.displayName?.text);
    } catch (e) {
      return { ok: false, erro: e instanceof Error ? e.message : "Não foi possível consultar o Google Maps." };
    }

    // Marca quem já está no CRM, pelo negócio do Maps ou pelo telefone
    const { data: existentes } = await context.supabase.from("crm_oportunidades").select("maps_place_id, whatsapp_norm");
    const placesNoCrm = new Set((existentes ?? []).map((e) => e.maps_place_id).filter(Boolean));
    const fonesNoCrm = new Set((existentes ?? []).map((e) => e.whatsapp_norm).filter(Boolean));

    const prospectos = places
      .map((p): Prospecto => {
        const fone = normalizarWhatsapp(p.nationalPhoneNumber);
        return {
          place_id: p.id!,
          nome: p.displayName!.text!,
          endereco: p.formattedAddress ?? null,
          telefone: p.nationalPhoneNumber ?? null,
          site: p.websiteUri ?? null,
          nota: p.rating ?? null,
          avaliacoes: p.userRatingCount ?? 0,
          categoria: p.primaryTypeDisplayName?.text ?? null,
          ...qualificarPorMaps(p),
          jaNoCrm: placesNoCrm.has(p.id!) || (!!fone && fonesNoCrm.has(fone)),
        };
      })
      .sort((a, b) => b.score - a.score);
    return { ok: true, prospectos };
  });

export const importarProspectos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { nicho: string; regiao: string; prospectos: Prospecto[] }) => ({
    nicho: String(d?.nicho ?? "").slice(0, 80),
    regiao: String(d?.regiao ?? "").slice(0, 80),
    prospectos: (Array.isArray(d?.prospectos) ? d.prospectos : []).slice(0, 20),
  }))
  .handler(async ({ data, context }): Promise<{ ok: true; criadas: number; repetidas: number; mensagens: number; avisoIa?: string } | Falha> => {
    if (!(await ehAdmin(context))) return SEM_ACESSO;
    const criadas: Array<{ id: string; p: Prospecto }> = [];
    let repetidas = 0;
    for (const p of data.prospectos) {
      const { data: nova, error } = await context.supabase
        .from("crm_oportunidades")
        .insert({
          nome_empresa: String(p.nome).slice(0, 200),
          whatsapp: p.telefone ? String(p.telefone).slice(0, 40) : null,
          nicho: data.nicho || p.categoria,
          regiao: data.regiao || null,
          origem: "maps",
          maps_place_id: String(p.place_id),
          score_oportunidade: Math.max(0, Math.min(100, Math.round(Number(p.score) || 0))),
        })
        .select("id")
        .single();
      if (error?.code === "23505") { repetidas += 1; continue; }
      if (error || !nova) return { ok: false, erro: "Não foi possível importar as empresas. Tente de novo." };
      criadas.push({ id: nova.id, p });
    }

    // Primeira mensagem do SDR para quem tem telefone; falha da IA não desfaz a importação
    let mensagens = 0;
    let avisoIa: string | undefined;
    try {
      const ms = await mensagensSdr(
        criadas.filter((c) => c.p.telefone).map((c) => ({ id: c.id, empresa: c.p.nome, nicho: data.nicho, regiao: data.regiao, sinais: (c.p.motivos ?? []).slice(0, 6) })),
      );
      mensagens = await gravarSugestoes(context, "sdr", "enviar_whatsapp", ms.map((m) => ({ oportunidade_id: m.id, conteudo: { mensagem: m.mensagem, justificativa: m.justificativa } })));
    } catch (e) {
      console.error("SDR da importação falhou:", e);
      avisoIa = `Empresas importadas, mas as mensagens não foram geradas: ${erroDeIa(e)}`;
    }
    return { ok: true, criadas: criadas.length, repetidas, mensagens, ...(avisoIa ? { avisoIa } : {}) };
  });

/* ── Assistente de follow-up: fila do dia ─────────────────────────── */

export const gerarFilaFollowup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true; geradas: number; candidatos: number } | Falha> => {
    if (!(await ehAdmin(context))) return SEM_ACESSO;
    const [ops, ativs, sugs, tarefas] = await Promise.all([
      context.supabase.from("crm_oportunidades").select(COLUNAS_OP).in("etapa", ["contatado", "diagnostico_enviado", "proposta", "negociacao"]),
      context.supabase.from("crm_atividades").select("oportunidade_id, tipo, descricao, created_at").order("created_at", { ascending: false }).limit(1000),
      context.supabase.from("crm_sugestoes_ia").select("oportunidade_id").eq("status", "pendente"),
      context.supabase.from("crm_tarefas").select("oportunidade_id").is("concluida_em", null),
    ]);
    if (ops.error) return { ok: false, erro: "Não foi possível ler o funil." };

    const historico = new Map<string, Array<{ tipo: string; descricao: string; created_at: string }>>();
    for (const a of ativs.data ?? []) {
      const l = historico.get(a.oportunidade_id) ?? [];
      if (l.length < 6) l.push(a);
      historico.set(a.oportunidade_id, l);
    }
    const comSugestao = new Set((sugs.data ?? []).map((s) => s.oportunidade_id));
    const comTarefa = new Set((tarefas.data ?? []).map((t) => t.oportunidade_id));

    const fila = filaFollowup(ops.data as Oportunidade[], (op) => ({
      ultimaAtividadeEm: historico.get(op.id)?.[0]?.created_at,
      temSugestaoPendente: comSugestao.has(op.id),
      temTarefaPendente: comTarefa.has(op.id),
    }));
    if (!fila.length) return { ok: true, geradas: 0, candidatos: 0 };

    try {
      const ms = await mensagensFollowup(fila.map(({ op, dias }) => ({
        id: op.id,
        empresa: op.nome_empresa,
        contato: op.nome_contato,
        nicho: op.nicho,
        etapa: rotuloEtapa(op.etapa),
        dias_parado: dias,
        servicos_interesse: op.servicos_interesse,
        historico: (historico.get(op.id) ?? []).map((a) => `${a.created_at.slice(0, 10)} ${a.tipo}: ${a.descricao}`),
      })));
      const diasPor = new Map(fila.map((f) => [f.op.id, f.dias]));
      const geradas = await gravarSugestoes(context, "followup", "enviar_whatsapp", ms.map((m) => ({
        oportunidade_id: m.id,
        conteudo: { mensagem: m.mensagem, justificativa: m.justificativa, dias_parado: diasPor.get(m.id) },
      })));
      return { ok: true, geradas, candidatos: fila.length };
    } catch (e) {
      console.error("Fila de follow-up falhou:", e);
      return { ok: false, erro: erroDeIa(e) };
    }
  });

/* ── Comercial: rascunho de proposta ──────────────────────────────── */

export const propostaRascunho = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { oportunidadeId: string }) => ({ oportunidadeId: String(d?.oportunidadeId ?? "") }))
  .handler(async ({ data, context }): Promise<{ ok: true } | Falha> => {
    if (!(await ehAdmin(context))) return SEM_ACESSO;
    const { data: op } = await context.supabase.from("crm_oportunidades").select(COLUNAS_OP).eq("id", data.oportunidadeId).maybeSingle();
    if (!op) return { ok: false, erro: "Oportunidade não encontrada." };
    try {
      const diagnostico = await dadosDoDiagnostico(context, op.lead_diagnostico_id);
      const r = await rascunhoProposta({
        empresa: op.nome_empresa,
        nicho: op.nicho,
        regiao: op.regiao,
        etapa: rotuloEtapa(op.etapa),
        servicos_interesse: op.servicos_interesse,
        valor_mensal: op.valor_mensal,
        diagnostico,
      });
      await gravarSugestoes(context, "comercial", "proposta_rascunho", [{ oportunidade_id: op.id, conteudo: r }]);
      return { ok: true };
    } catch (e) {
      console.error("Proposta falhou:", e);
      return { ok: false, erro: erroDeIa(e) };
    }
  });

/* ── Analista: resumo executivo da semana ─────────────────────────── */

export type ResumoSemanal = { metricas: MetricasSemana; resumo: string; gargalo: string; acoes: string[] };

export const resumoSemanal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true; resumo: ResumoSemanal } | Falha> => {
    if (!(await ehAdmin(context))) return SEM_ACESSO;
    const desde = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const [ops, movs] = await Promise.all([
      context.supabase.from("crm_oportunidades").select(COLUNAS_OP),
      context.supabase.from("crm_atividades").select("oportunidade_id, tipo, metadados, created_at").eq("tipo", "mudanca_etapa").gte("created_at", desde),
    ]);
    if (ops.error || movs.error) return { ok: false, erro: "Não foi possível ler os dados do CRM." };
    const metricas = metricasSemana(ops.data as Oportunidade[], movs.data ?? []);
    try {
      return { ok: true, resumo: { metricas, ...(await analiseSemanal(metricas)) } };
    } catch (e) {
      console.error("Analista falhou:", e);
      return { ok: false, erro: erroDeIa(e) };
    }
  });
