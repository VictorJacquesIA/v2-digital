import { useState, type FormEvent } from "react";
import { Badge, Button } from "./ui";
import { TIPOS_TAREFA, amanhaAsNove, paraInputLocal, rotuloTipoTarefa, type Tarefa, type TipoTarefa } from "@/lib/crm/agenda";
import { linkWhatsapp } from "@/lib/crm/funil";
import { useConcluirTarefa, useCriarTarefa, useTarefas } from "@/lib/crm/consultas";

const quando = (s: string) => new Date(s).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Uma tarefa com caixa de conclusão. `contexto` mostra de quem é a tarefa (na agenda). */
export function TarefaLinha({ tarefa, contexto, whatsapp }: { tarefa: Tarefa; contexto?: string | undefined; whatsapp?: string | null | undefined }) {
  const concluir = useConcluirTarefa();
  const feita = !!tarefa.concluida_em;
  const wa = !feita && (tarefa.tipo === "whatsapp" || tarefa.tipo === "followup") ? linkWhatsapp(whatsapp) : null;
  return (
    <li className={`crm-tarefa${feita ? " crm-tarefa-feita" : ""}`}>
      <label className="crm-tarefa-check">
        <input
          type="checkbox"
          checked={feita}
          disabled={concluir.isPending}
          onChange={(e) => concluir.mutate({ tarefa, concluir: e.target.checked })}
          aria-label={`${feita ? "Reabrir" : "Concluir"}: ${tarefa.descricao}`}
        />
      </label>
      <div className="crm-tarefa-corpo">
        <span className="crm-tarefa-t">{tarefa.descricao}</span>
        <span className="leads-sub">
          {rotuloTipoTarefa(tarefa.tipo)} · {quando(tarefa.vence_em)}
          {contexto && <> · {contexto}</>}
        </span>
      </div>
      <div className="crm-tarefa-lado">
        {tarefa.criada_por_ia && <Badge>Sugerida pela IA</Badge>}
        {wa && <a className="leads-nota-btn" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
      </div>
    </li>
  );
}

export function FormTarefa({ oportunidadeId, onCriada, descricaoInicial = "" }: { oportunidadeId: string; onCriada?: () => void; descricaoInicial?: string }) {
  const criar = useCriarTarefa();
  const [tipo, setTipo] = useState<TipoTarefa>("followup");
  const [descricao, setDescricao] = useState(descricaoInicial);
  const [vence, setVence] = useState(() => paraInputLocal(amanhaAsNove()));

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || !vence) return;
    criar.mutate(
      { oportunidade_id: oportunidadeId, tipo, descricao, vence_em: new Date(vence) },
      { onSuccess: () => { setDescricao(""); onCriada?.(); } },
    );
  }

  return (
    <form className="crm-form-tarefa" onSubmit={enviar}>
      <label className="crm-campo">
        <span className="v2-field-label">Tipo</span>
        <select className="leads-status" value={tipo} onChange={(e) => setTipo(e.target.value as TipoTarefa)}>
          {TIPOS_TAREFA.map((t) => <option key={t.v} value={t.v}>{t.r}</option>)}
        </select>
      </label>
      <label className="crm-campo">
        <span className="v2-field-label">Quando</span>
        <input className="v2-input" type="datetime-local" value={vence} required onChange={(e) => setVence(e.target.value)} />
      </label>
      <label className="crm-campo crm-campo-largo">
        <span className="v2-field-label">O que fazer</span>
        <input className="v2-input" value={descricao} required placeholder="Ex.: perguntar se viu o diagnóstico" onChange={(e) => setDescricao(e.target.value)} />
      </label>
      <div className="leads-acoes crm-campo-largo">
        <Button variant="secondary" size="sm" type="submit" disabled={criar.isPending}>{criar.isPending ? "Salvando…" : "Agendar tarefa"}</Button>
        {criar.isError && <span className="crm-erro" role="alert">Não foi possível agendar. Tente de novo.</span>}
      </div>
    </form>
  );
}

/** Bloco da gaveta do funil: tarefas da oportunidade e formulário para agendar outra. */
export function TarefasDaOportunidade({ oportunidadeId }: { oportunidadeId: string }) {
  const tarefas = useTarefas();
  const minhas = (tarefas.data ?? []).filter((t) => t.oportunidade_id === oportunidadeId);
  const pendentes = minhas.filter((t) => !t.concluida_em);
  const feitas = minhas.filter((t) => t.concluida_em);
  return (
    <section className="crm-historico" aria-label="Tarefas">
      <h3 className="leads-bloco-t">Tarefas</h3>
      {tarefas.isLoading && <p className="leads-sub">Carregando tarefas…</p>}
      {pendentes.length === 0 && !tarefas.isLoading && <p className="leads-sub">Nenhuma tarefa pendente para este contato.</p>}
      <ul className="crm-tarefas">
        {[...pendentes, ...feitas].map((t) => <TarefaLinha key={t.id} tarefa={t} />)}
      </ul>
      <FormTarefa oportunidadeId={oportunidadeId} />
    </section>
  );
}
