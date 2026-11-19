/*
 * Regras determinísticas do copiloto (sem IA): a IA só escreve as mensagens;
 * quem decide quem entra na fila e qual a nota de oportunidade é este código.
 */
import { ETAPAS, emAberto, ehEtapa, rotuloEtapa, type Etapa, type Oportunidade } from "./funil";

/* ── SDR: nota de oportunidade a partir do Google Maps ─────────────── */

export type DadosMaps = {
  rating?: number | undefined;
  userRatingCount?: number | undefined;
  websiteUri?: string | undefined;
  nationalPhoneNumber?: string | undefined;
  photos?: unknown[] | undefined;
  regularOpeningHours?: { periods?: unknown[] } | undefined;
};

export type Qualificacao = { score: number; faixa: "alta" | "media" | "baixa"; motivos: string[] };

// Link de rede social ou agregador não conta como site próprio
const NAO_E_SITE = /(instagram\.com|facebook\.com|fb\.com|linktr\.ee|wa\.me|whatsapp\.com|tiktok\.com|ifood\.com|business\.site|negocio\.site)/i;

/**
 * Quanto mais o negócio precisa de ajuda (e dá para falar com ele), maior a nota.
 * Ex.: nota 4,1, 28 avaliações, sem site e com telefone = 65 (alta).
 */
export function qualificarPorMaps(p: DadosMaps): Qualificacao {
  let score = 0;
  const motivos: string[] = [];

  if (!p.websiteUri) { score += 30; motivos.push("Sem site próprio"); }
  else if (NAO_E_SITE.test(p.websiteUri)) { score += 25; motivos.push("Usa rede social no lugar de site"); }

  const n = p.userRatingCount ?? 0;
  if (n < 10) { score += 25; motivos.push(n === 0 ? "Nenhuma avaliação no Google" : `Só ${n} ${n === 1 ? "avaliação" : "avaliações"} no Google`); }
  else if (n < 50) { score += 15; motivos.push(`${n} avaliações (pouca prova social)`); }
  else if (n < 100) score += 5;

  const nota = p.rating;
  if (nota === undefined) score += 10;
  else if (nota < 4) { score += 15; motivos.push(`Nota ${nota.toLocaleString("pt-BR")} abaixo de 4`); }
  else if (nota < 4.5) { score += 10; motivos.push(`Nota ${nota.toLocaleString("pt-BR")}, dá para subir`); }
  else score += 5;

  const fotos = p.photos?.length ?? 0;
  if (fotos === 0) { score += 10; motivos.push("Perfil sem fotos"); }
  else if (fotos < 5) { score += 5; motivos.push("Poucas fotos no perfil"); }

  if (!p.regularOpeningHours?.periods?.length) { score += 5; motivos.push("Sem horário de funcionamento"); }

  // Sem telefone não há como abordar pelo WhatsApp: a oportunidade vale menos
  if (p.nationalPhoneNumber) score += 10;
  else motivos.push("Sem telefone no perfil");

  score = Math.min(100, score);
  return { score, faixa: score >= 60 ? "alta" : score >= 35 ? "media" : "baixa", motivos };
}

/* ── Assistente de follow-up: quem entra na fila do dia ─────────────── */

/** Etapas em que já houve conversa e cabe um follow-up (Novo é da 1ª mensagem do SDR). */
const ETAPAS_FOLLOWUP: ReadonlySet<string> = new Set(["contatado", "diagnostico_enviado", "proposta", "negociacao"]);
export const DIAS_SEM_RESPOSTA = 3;
export const LIMITE_FILA = 8;

const DIA = 86_400_000;

export type ContextoFollowup = {
  ultimaAtividadeEm?: string | null | undefined;
  temSugestaoPendente: boolean;
  temTarefaPendente: boolean;
};

/** Dias desde o último movimento: a entrada na etapa ou a atividade mais recente, o que for mais novo. */
export function diasParado(op: Pick<Oportunidade, "etapa_desde">, ultimaAtividadeEm?: string | null, agora: number = Date.now()): number {
  const ultimo = Math.max(new Date(op.etapa_desde).getTime(), ultimaAtividadeEm ? new Date(ultimaAtividadeEm).getTime() : 0);
  return Math.max(0, Math.floor((agora - ultimo) / DIA));
}

export function precisaFollowup(op: Pick<Oportunidade, "etapa" | "etapa_desde" | "whatsapp">, ctx: ContextoFollowup, agora: number = Date.now()): boolean {
  if (!ETAPAS_FOLLOWUP.has(op.etapa) || !op.whatsapp) return false;
  if (ctx.temSugestaoPendente || ctx.temTarefaPendente) return false;
  return diasParado(op, ctx.ultimaAtividadeEm, agora) >= DIAS_SEM_RESPOSTA;
}

/** Fila do dia: quem precisa de follow-up, mais parado primeiro, até o limite. */
export function filaFollowup<O extends Pick<Oportunidade, "id" | "etapa" | "etapa_desde" | "whatsapp">>(
  ops: O[],
  ctx: (op: O) => ContextoFollowup,
  agora: number = Date.now(),
  limite = LIMITE_FILA,
): Array<{ op: O; dias: number }> {
  return ops
    .map((op) => ({ op, c: ctx(op) }))
    .filter(({ op, c }) => precisaFollowup(op, c, agora))
    .map(({ op, c }) => ({ op, dias: diasParado(op, c.ultimaAtividadeEm, agora) }))
    .sort((a, b) => b.dias - a.dias)
    .slice(0, limite);
}

/* ── Analista: números da semana ───────────────────────────────────── */

export type MetricasSemana = {
  novos: number;
  fechados: number;
  perdidos: number;
  receitaFechada: number;
  taxaResposta: number | null;
  motivosPerda: Array<{ motivo: string; total: number }>;
  paradosPorEtapa: Array<{ etapa: string; total: number }>;
};

type Mov = { oportunidade_id: string; tipo: string; metadados: unknown; created_at: string };
const deMov = (a: Mov) => (a.metadados as { de?: string; para?: string } | null) ?? {};

/**
 * Taxa de resposta: dos contatos que entraram em "Contatado" nos últimos 30 dias,
 * quantos avançaram para uma etapa à frente (exceto perdido).
 */
export function metricasSemana(
  ops: Pick<Oportunidade, "id" | "etapa" | "etapa_desde" | "created_at" | "fechado_em" | "motivo_perda" | "valor_mensal">[],
  movimentos: Mov[],
  agora: number = Date.now(),
): MetricasSemana {
  const semana = agora - 7 * DIA;
  const mes = agora - 30 * DIA;
  const naSemana = (s: string | null) => !!s && new Date(s).getTime() >= semana;
  const ordem = (e: string) => ETAPAS.findIndex((x) => x.v === e);

  const mudancas = movimentos.filter((m) => m.tipo === "mudanca_etapa");
  const contatados = new Set(mudancas.filter((m) => deMov(m).para === "contatado" && new Date(m.created_at).getTime() >= mes).map((m) => m.oportunidade_id));
  const avancaram = new Set(
    mudancas
      .filter((m) => contatados.has(m.oportunidade_id) && deMov(m).para !== "perdido" && ordem(deMov(m).para ?? "") > ordem("contatado"))
      .map((m) => m.oportunidade_id),
  );

  const perdidosSemana = mudancas.filter((m) => deMov(m).para === "perdido" && naSemana(m.created_at)).map((m) => m.oportunidade_id);
  const motivos = new Map<string, number>();
  for (const id of perdidosSemana) {
    const m = ops.find((o) => o.id === id)?.motivo_perda || "Sem motivo";
    motivos.set(m, (motivos.get(m) ?? 0) + 1);
  }

  const parados = new Map<string, number>();
  for (const o of ops) {
    if (!ehEtapa(o.etapa) || !emAberto(o.etapa)) continue;
    if (agora - new Date(o.etapa_desde).getTime() >= 5 * DIA) parados.set(o.etapa, (parados.get(o.etapa) ?? 0) + 1);
  }

  const fechadosSemana = ops.filter((o) => o.etapa === "fechado" && naSemana(o.fechado_em));
  return {
    novos: ops.filter((o) => naSemana(o.created_at)).length,
    fechados: fechadosSemana.length,
    perdidos: perdidosSemana.length,
    receitaFechada: fechadosSemana.reduce((s, o) => s + (Number(o.valor_mensal) || 0), 0),
    taxaResposta: contatados.size ? Math.round((avancaram.size / contatados.size) * 100) : null,
    motivosPerda: [...motivos].map(([motivo, total]) => ({ motivo, total })).sort((a, b) => b.total - a.total),
    paradosPorEtapa: [...parados]
      .map(([etapa, total]) => ({ etapa: rotuloEtapa(etapa as Etapa), total }))
      .sort((a, b) => b.total - a.total),
  };
}

/* ── Fila de aprovação ─────────────────────────────────────────────── */

export const PAPEIS = { sdr: "SDR", followup: "Follow-up", comercial: "Comercial", analista: "Analista" } as const;
export const rotuloPapel = (p: string) => PAPEIS[p as keyof typeof PAPEIS] ?? p;

export type ItemProposta = { servico: string; entregaveis: string; valor_mensal: number };
export type ConteudoSugestao = {
  mensagem?: string;
  justificativa?: string;
  resumo?: string;
  itens?: ItemProposta[];
  valor_mensal?: number;
  dias_parado?: number;
};
