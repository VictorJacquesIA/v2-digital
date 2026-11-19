import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CrmShell } from "@/components/v2/crm-nav";
import { CHAVE_SUGESTOES, FilaAprovacao, useSugestoesPendentes } from "@/components/v2/crm-sugestoes";
import { Button } from "@/components/v2/ui";
import { agruparTarefas } from "@/lib/crm/agenda";
import { emAberto, estaEsfriando, formatarMoeda, receitaPrevista } from "@/lib/crm/funil";
import { useOportunidades, useTarefas } from "@/lib/crm/consultas";
import { gerarFilaFollowup, resumoSemanal, type ResumoSemanal } from "@/lib/crm-ia.functions";

export const Route = createFileRoute("/_authenticated/crm/")({
  head: () => ({
    meta: [
      { title: "Visão geral — CRM V2 Digital" },
      { name: "description", content: "Fila do dia e números do CRM da V2 Digital." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VisaoGeralPage,
});

function VisaoGeralPage() {
  const qc = useQueryClient();
  const gerar = useServerFn(gerarFilaFollowup);
  const [estado, setEstado] = useState<{ carregando?: boolean; msg?: string }>({});

  async function gerarFila() {
    setEstado({ carregando: true });
    const r = await gerar();
    if (!r.ok) return setEstado({ msg: r.erro });
    qc.invalidateQueries({ queryKey: CHAVE_SUGESTOES });
    setEstado({
      msg: r.candidatos === 0
        ? "Ninguém precisa de follow-up agora: todos os contatos em andamento falaram com você nos últimos 3 dias ou já têm tarefa."
        : `${r.geradas} ${r.geradas === 1 ? "mensagem de follow-up pronta" : "mensagens de follow-up prontas"} para aprovar.`,
    });
  }

  return (
    <CrmShell
      titulo="Visão geral"
      acao={<Button size="sm" onClick={gerarFila} disabled={estado.carregando}>{estado.carregando ? "Gerando…" : "Gerar fila do dia"}</Button>}
    >
      <Metricas />
      <section className="crm-bloco crm-secao" aria-labelledby="vg-fila">
        <div className="crm-bloco-cab">
          <h2 id="vg-fila" className="crm-bloco-t">Fila de aprovação <ContagemFila /></h2>
          {estado.msg && <span className="leads-sub" role="status">{estado.msg}</span>}
        </div>
        <p className="leads-sub">A IA prepara; nada sai sem você aprovar. Ao aprovar, o WhatsApp abre com o texto pronto e um follow-up fica agendado para daqui a 3 dias.</p>
        <FilaAprovacao />
      </section>
      <Analista />
    </CrmShell>
  );
}

function ContagemFila() {
  const fila = useSugestoesPendentes();
  return <span className="leads-conta">{fila.data?.length ?? 0}</span>;
}

function Metricas() {
  const ops = useOportunidades();
  const tarefas = useTarefas();
  const m = useMemo(() => {
    const lista = ops.data ?? [];
    const g = agruparTarefas(tarefas.data ?? []);
    return {
      hoje: g.hoje.length,
      atrasadas: g.atrasadas.length,
      esfriando: lista.filter((o) => estaEsfriando(o)).length,
      abertas: lista.filter((o) => emAberto(o.etapa)).length,
      receita: receitaPrevista(lista),
    };
  }, [ops.data, tarefas.data]);
  if (ops.error || tarefas.error) return <p className="ds-body">Não foi possível carregar os números. Confira se a migração do CRM foi aplicada no Supabase.</p>;
  return (
    <dl className="crm-metricas">
      <div className="crm-metrica"><dt>Tarefas de hoje</dt><dd>{m.hoje}</dd>{m.atrasadas > 0 && <span className="leads-sub">+ {m.atrasadas} atrasadas</span>}</div>
      <div className="crm-metrica"><dt>Contatos esfriando</dt><dd>{m.esfriando}</dd><span className="leads-sub">5+ dias na mesma etapa</span></div>
      <div className="crm-metrica"><dt>Oportunidades no funil</dt><dd>{m.abertas}</dd></div>
      <div className="crm-metrica"><dt>Receita prevista</dt><dd>{formatarMoeda(m.receita)}</dd><span className="leads-sub">por mês, em aberto</span></div>
    </dl>
  );
}

function Analista() {
  const pedir = useServerFn(resumoSemanal);
  const [r, setR] = useState<{ carregando?: boolean; erro?: string; resumo?: ResumoSemanal }>({});
  async function gerar() {
    setR({ carregando: true });
    const res = await pedir();
    setR(res.ok ? { resumo: res.resumo } : { erro: res.erro });
  }
  const s = r.resumo;
  return (
    <section className="crm-bloco crm-secao" aria-labelledby="vg-analista">
      <div className="crm-bloco-cab">
        <h2 id="vg-analista" className="crm-bloco-t">Analista da semana</h2>
        <Button variant="secondary" size="sm" onClick={gerar} disabled={r.carregando}>{r.carregando ? "Analisando…" : s ? "Gerar de novo" : "Gerar resumo da semana"}</Button>
      </div>
      {r.erro && <p className="crm-erro" role="alert">{r.erro}</p>}
      {!s && !r.erro && <p className="leads-sub">Resumo executivo dos últimos 7 dias: taxa de resposta, onde os leads travam e 3 ações prioritárias.</p>}
      {s && (
        <div className="crm-analise">
          <dl className="crm-metricas crm-metricas-mini">
            <div className="crm-metrica"><dt>Novos</dt><dd>{s.metricas.novos}</dd></div>
            <div className="crm-metrica"><dt>Fechados</dt><dd>{s.metricas.fechados}</dd></div>
            <div className="crm-metrica"><dt>Perdidos</dt><dd>{s.metricas.perdidos}</dd></div>
            <div className="crm-metrica"><dt>Taxa de resposta</dt><dd>{s.metricas.taxaResposta === null ? "—" : `${s.metricas.taxaResposta}%`}</dd></div>
          </dl>
          <p className="leads-bloco-txt">{s.resumo}</p>
          <p className="leads-bloco-txt"><strong>Onde está travando:</strong> {s.gargalo}</p>
          <ol className="crm-acoes-ia">{s.acoes.map((a) => <li key={a}>{a}</li>)}</ol>
        </div>
      )}
    </section>
  );
}
