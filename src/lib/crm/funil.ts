/*
 * Regras do funil de vendas do CRM. Sem dependência de React ou Supabase,
 * para serem testadas isoladamente.
 */

export const ETAPAS = [
  { v: "novo", r: "Novo" },
  { v: "contatado", r: "Contatado" },
  { v: "diagnostico_enviado", r: "Diagnóstico enviado" },
  { v: "proposta", r: "Proposta" },
  { v: "negociacao", r: "Negociação" },
  { v: "fechado", r: "Fechado" },
  { v: "perdido", r: "Perdido" },
] as const;
export type Etapa = (typeof ETAPAS)[number]["v"];

export const ORIGENS = [
  { v: "diagnostico", r: "Diagnóstico" },
  { v: "maps", r: "Google Maps" },
  { v: "whatsapp", r: "WhatsApp" },
  { v: "indicacao", r: "Indicação" },
  { v: "manual", r: "Manual" },
] as const;
export type Origem = (typeof ORIGENS)[number]["v"];

export const SERVICOS = [
  "Tráfego pago",
  "Site ou landing page",
  "Google Meu Negócio",
  "Placa QR + NFC",
  "Social media",
  "IA para o negócio",
] as const;

export const MOTIVOS_PERDA = [
  "Preço",
  "Sem resposta",
  "Fechou com concorrente",
  "Sem necessidade agora",
  "Fora do perfil",
  "Outro",
] as const;

export type Oportunidade = {
  id: string;
  nome_empresa: string;
  nome_contato: string | null;
  whatsapp: string | null;
  nicho: string | null;
  regiao: string | null;
  origem: string;
  etapa: string;
  valor_mensal: number | string;
  servicos_interesse: string[];
  motivo_perda: string | null;
  score_oportunidade: number;
  etapa_desde: string;
  fechado_em: string | null;
  lead_diagnostico_id: string | null;
  created_at: string;
};

export const rotuloEtapa = (v: string) => ETAPAS.find((e) => e.v === v)?.r ?? v;
export const rotuloOrigem = (v: string) => ORIGENS.find((o) => o.v === v)?.r ?? v;
export const ehEtapa = (v: unknown): v is Etapa => ETAPAS.some((e) => e.v === v);

/** Etapas que não contam como receita em aberto no funil. */
const ENCERRADAS: ReadonlySet<string> = new Set(["fechado", "perdido"]);
export const emAberto = (etapa: string) => !ENCERRADAS.has(etapa);

/** Mesma regra da coluna gerada whatsapp_norm no banco: só dígitos, sem o 55 do país. */
export function normalizarWhatsapp(valor: string | null | undefined): string | null {
  const d = (valor ?? "").replace(/\D/g, "");
  if (!d) return null;
  return /^55\d{10,11}$/.test(d) ? d.slice(2) : d;
}

/** Link wa.me com DDI 55, opcionalmente com a mensagem já escrita. */
export function linkWhatsapp(valor: string | null | undefined, texto?: string): string | null {
  const n = normalizarWhatsapp(valor);
  if (!n) return null;
  return `https://wa.me/55${n}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
}

const DIA = 24 * 60 * 60 * 1000;
export function diasNaEtapa(etapaDesde: string | Date, agora: Date | number = Date.now()): number {
  const fim = typeof agora === "number" ? agora : agora.getTime();
  return Math.max(0, Math.floor((fim - new Date(etapaDesde).getTime()) / DIA));
}

/** Parado demais na mesma etapa em aberto: sinal de contato esfriando. */
export const LIMITE_ESFRIANDO = 5;
export function estaEsfriando(op: Pick<Oportunidade, "etapa" | "etapa_desde">, agora: Date | number = Date.now()): boolean {
  return emAberto(op.etapa) && diasNaEtapa(op.etapa_desde, agora) >= LIMITE_ESFRIANDO;
}

export const valorNumerico = (v: number | string | null | undefined) => {
  const n = typeof v === "number" ? v : Number.parseFloat(v ?? "");
  return Number.isFinite(n) ? n : 0;
};

export function agruparPorEtapa<T extends Pick<Oportunidade, "etapa" | "etapa_desde">>(ops: T[]): Record<Etapa, T[]> {
  const grupos = Object.fromEntries(ETAPAS.map((e) => [e.v, [] as T[]])) as Record<Etapa, T[]>;
  for (const op of ops) if (ehEtapa(op.etapa)) grupos[op.etapa].push(op);
  // Quem está parado há mais tempo aparece primeiro
  for (const lista of Object.values(grupos)) lista.sort((a, b) => a.etapa_desde.localeCompare(b.etapa_desde));
  return grupos;
}

export function totaisPorEtapa(ops: Pick<Oportunidade, "etapa" | "valor_mensal">[]): Record<Etapa, { quantidade: number; valor: number }> {
  const t = Object.fromEntries(ETAPAS.map((e) => [e.v, { quantidade: 0, valor: 0 }])) as Record<Etapa, { quantidade: number; valor: number }>;
  for (const op of ops) {
    if (!ehEtapa(op.etapa)) continue;
    t[op.etapa].quantidade += 1;
    t[op.etapa].valor += valorNumerico(op.valor_mensal);
  }
  return t;
}

/** Receita mensal prevista: soma das oportunidades ainda em aberto. */
export const receitaPrevista = (ops: Pick<Oportunidade, "etapa" | "valor_mensal">[]) =>
  ops.filter((o) => ehEtapa(o.etapa) && emAberto(o.etapa)).reduce((s, o) => s + valorNumerico(o.valor_mensal), 0);

/** Mover para "perdido" exige motivo; sair de "perdido" limpa o motivo (o banco faz o mesmo). */
export function camposDaMudanca(para: Etapa, motivo?: string): { etapa: Etapa; motivo_perda?: string | null } {
  if (para !== "perdido") return { etapa: para };
  const m = motivo?.trim();
  if (!m) throw new Error("Informe o motivo da perda.");
  return { etapa: para, motivo_perda: m };
}

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
export const formatarMoeda = (v: number) => moeda.format(v);
