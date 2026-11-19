import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CrmShell } from "@/components/v2/crm-nav";
import { FormTarefa, TarefaLinha } from "@/components/v2/crm-tarefas";
import { Button } from "@/components/v2/ui";
import { agruparTarefas, amanhaAsNove, esfriandoSemTarefa, type Tarefa } from "@/lib/crm/agenda";
import { diasNaEtapa, linkWhatsapp, rotuloEtapa, type Oportunidade } from "@/lib/crm/funil";
import { useCriarTarefa, useOportunidades, useTarefas } from "@/lib/crm/consultas";

export const Route = createFileRoute("/_authenticated/crm/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda — CRM V2 Digital" },
      { name: "description", content: "Tarefas e follow-ups da V2 Digital." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AgendaPage,
});

function AgendaPage() {
  const [nova, setNova] = useState(false);
  return (
    <CrmShell titulo="Agenda" acao={<Button size="sm" onClick={() => setNova(true)}>Nova tarefa</Button>}>
      <Agenda />
      {nova && <ModalNovaTarefa onFechar={() => setNova(false)} />}
    </CrmShell>
  );
}

function Agenda() {
  const tarefas = useTarefas();
  const ops = useOportunidades();
  const porId = useMemo(() => new Map((ops.data ?? []).map((o) => [o.id, o])), [ops.data]);
  const g = useMemo(() => agruparTarefas(tarefas.data ?? []), [tarefas.data]);
  const esfriando = useMemo(() => esfriandoSemTarefa(ops.data ?? [], tarefas.data ?? []), [ops.data, tarefas.data]);

  if (tarefas.isLoading || ops.isLoading) return <p className="ds-body">Carregando a agenda…</p>;
  if (tarefas.error || ops.error) return <p className="ds-body">Não foi possível carregar a agenda. Confira se a migração do CRM foi aplicada no Supabase.</p>;

  const lista = (ts: Tarefa[], vazio: string) =>
    ts.length === 0 ? (
      <p className="leads-sub">{vazio}</p>
    ) : (
      <ul className="crm-tarefas">
        {ts.map((t) => {
          const op = porId.get(t.oportunidade_id);
          return <TarefaLinha key={t.id} tarefa={t} contexto={op?.nome_empresa} whatsapp={op?.whatsapp} />;
        })}
      </ul>
    );

  return (
    <div className="crm-agenda">
      <p className="crm-resumo">
        {contar(g.atrasadas.length, "atrasada", "atrasadas")} · {g.hoje.length} para hoje · {g.proximos7.length} nos próximos 7 dias · {contar(esfriando.length, "contato esfriando", "contatos esfriando")}
      </p>

      <div className="crm-agenda-grade">
        <section className={`crm-bloco${g.atrasadas.length ? " crm-bloco-alerta" : ""}`} aria-labelledby="ag-atrasadas">
          <h2 id="ag-atrasadas" className="crm-bloco-t">Atrasadas <span className="leads-conta">{g.atrasadas.length}</span></h2>
          {lista(g.atrasadas, "Nada atrasado.")}
        </section>
        <section className="crm-bloco" aria-labelledby="ag-hoje">
          <h2 id="ag-hoje" className="crm-bloco-t">Hoje <span className="leads-conta">{g.hoje.length}</span></h2>
          {lista(g.hoje, "Nenhuma tarefa para hoje.")}
        </section>
        <section className="crm-bloco" aria-labelledby="ag-semana">
          <h2 id="ag-semana" className="crm-bloco-t">Próximos 7 dias <span className="leads-conta">{g.proximos7.length}</span></h2>
          {lista(g.proximos7, "Nada agendado para a semana.")}
          {g.depois.length > 0 && <p className="leads-sub">Mais {g.depois.length} depois disso.</p>}
        </section>
      </div>

      <section className="crm-bloco" aria-labelledby="ag-frios">
        <h2 id="ag-frios" className="crm-bloco-t">Contatos esfriando <span className="leads-conta">{esfriando.length}</span></h2>
        <p className="leads-sub">Parados há 5 dias ou mais na mesma etapa e sem nenhuma tarefa pendente.</p>
        {esfriando.length === 0 ? (
          <p className="leads-sub">Nenhum contato esquecido.</p>
        ) : (
          <ul className="crm-tarefas">
            {esfriando.map((o) => <LinhaEsfriando key={o.id} op={o} />)}
          </ul>
        )}
      </section>

      {g.concluidas.length > 0 && (
        <details className="crm-bloco">
          <summary className="crm-bloco-t">Concluídas nos últimos 14 dias <span className="leads-conta">{g.concluidas.length}</span></summary>
          {lista(g.concluidas, "")}
        </details>
      )}
    </div>
  );
}

const contar = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

function LinhaEsfriando({ op }: { op: Oportunidade }) {
  const criar = useCriarTarefa();
  const dias = diasNaEtapa(op.etapa_desde);
  const wa = linkWhatsapp(op.whatsapp);
  return (
    <li className="crm-tarefa">
      <div className="crm-tarefa-corpo">
        <span className="crm-tarefa-t">{op.nome_empresa}</span>
        <span className="leads-sub">{rotuloEtapa(op.etapa)} há {dias} dias</span>
      </div>
      <div className="crm-tarefa-lado">
        {wa && <a className="leads-nota-btn" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>}
        <Button
          variant="secondary"
          size="sm"
          disabled={criar.isPending}
          onClick={() => criar.mutate({ oportunidade_id: op.id, tipo: "followup", descricao: `Retomar contato (parado há ${dias} dias em ${rotuloEtapa(op.etapa)})`, vence_em: amanhaAsNove() })}
        >
          {criar.isPending ? "Agendando…" : "Follow-up amanhã às 9h"}
        </Button>
      </div>
    </li>
  );
}

function ModalNovaTarefa({ onFechar }: { onFechar: () => void }) {
  const ops = useOportunidades();
  const abertas = (ops.data ?? []).filter((o) => o.etapa !== "perdido").sort((a, b) => a.nome_empresa.localeCompare(b.nome_empresa, "pt-BR"));
  const [opId, setOpId] = useState("");
  return (
    <div className="leads-modal-fundo" onClick={onFechar} onKeyDown={(e) => e.key === "Escape" && onFechar()}>
      <div className="leads-modal" role="dialog" aria-modal="true" aria-labelledby="ag-nova-t" onClick={(e) => e.stopPropagation()}>
        <div className="leads-top">
          <h2 id="ag-nova-t" className="ds-h3">Nova tarefa</h2>
          <button className="leads-nota-btn" onClick={onFechar}>Fechar</button>
        </div>
        <label className="crm-campo">
          <span className="v2-field-label">Oportunidade</span>
          <select className="leads-status" value={opId} onChange={(e) => setOpId(e.target.value)} autoFocus>
            <option value="" disabled>Escolha o contato</option>
            {abertas.map((o) => <option key={o.id} value={o.id}>{o.nome_empresa}</option>)}
          </select>
        </label>
        {abertas.length === 0 && <p className="leads-sub">Nenhuma oportunidade em aberto. Crie uma no funil primeiro.</p>}
        {opId && <FormTarefa key={opId} oportunidadeId={opId} onCriada={onFechar} />}
      </div>
    </div>
  );
}
