/*
 * Regras da agenda de tarefas e follow-ups do CRM. Sem React ou Supabase.
 * Os dias seguem o fuso de quem usa o painel (Brasil), não o UTC.
 */
import { estaEsfriando, type Oportunidade } from "./funil";

export const TIPOS_TAREFA = [
  { v: "whatsapp", r: "WhatsApp" },
  { v: "ligacao", r: "Ligação" },
  { v: "reuniao", r: "Reunião" },
  { v: "proposta", r: "Proposta" },
  { v: "followup", r: "Follow-up" },
] as const;
export type TipoTarefa = (typeof TIPOS_TAREFA)[number]["v"];
export const rotuloTipoTarefa = (v: string) => TIPOS_TAREFA.find((t) => t.v === v)?.r ?? v;

export type Tarefa = {
  id: string;
  oportunidade_id: string;
  tipo: string;
  descricao: string;
  vence_em: string;
  concluida_em: string | null;
  criada_por_ia: boolean;
};

const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const somarDias = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export type Grupos<T> = { atrasadas: T[]; hoje: T[]; proximos7: T[]; depois: T[]; concluidas: T[] };

/**
 * Atrasada: venceu antes do início de hoje. Hoje: vence até o fim do dia.
 * Próximos 7 dias: de amanhã até o fim do 7º dia. Concluídas ficam à parte.
 */
export function agruparTarefas<T extends Pick<Tarefa, "vence_em" | "concluida_em">>(tarefas: T[], agora: Date = new Date()): Grupos<T> {
  const hoje = inicioDoDia(agora);
  const amanha = somarDias(hoje, 1);
  const limite7 = somarDias(hoje, 8);
  const g: Grupos<T> = { atrasadas: [], hoje: [], proximos7: [], depois: [], concluidas: [] };
  for (const t of tarefas) {
    if (t.concluida_em) { g.concluidas.push(t); continue; }
    const v = new Date(t.vence_em);
    if (v < hoje) g.atrasadas.push(t);
    else if (v < amanha) g.hoje.push(t);
    else if (v < limite7) g.proximos7.push(t);
    else g.depois.push(t);
  }
  const porData = (a: T, b: T) => a.vence_em.localeCompare(b.vence_em);
  for (const k of ["atrasadas", "hoje", "proximos7", "depois"] as const) g[k].sort(porData);
  g.concluidas.sort((a, b) => (b.concluida_em ?? "").localeCompare(a.concluida_em ?? ""));
  return g;
}

/**
 * Contatos esfriando que ainda não têm nenhuma tarefa pendente: são os que
 * estão sendo esquecidos e precisam de um próximo passo.
 */
export function esfriandoSemTarefa<O extends Pick<Oportunidade, "id" | "etapa" | "etapa_desde">>(
  ops: O[],
  tarefas: Pick<Tarefa, "oportunidade_id" | "concluida_em">[],
  agora: Date | number = Date.now(),
): O[] {
  const comTarefa = new Set(tarefas.filter((t) => !t.concluida_em).map((t) => t.oportunidade_id));
  return ops
    .filter((o) => estaEsfriando(o, agora) && !comTarefa.has(o.id))
    .sort((a, b) => a.etapa_desde.localeCompare(b.etapa_desde));
}

/** Amanhã às 9h no horário local: padrão para o follow-up criado com 1 clique. */
export function amanhaAsNove(agora: Date = new Date()): Date {
  const d = somarDias(inicioDoDia(agora), 1);
  d.setHours(9, 0, 0, 0);
  return d;
}

/** Valor para <input type="datetime-local"> no horário local. */
export function paraInputLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
