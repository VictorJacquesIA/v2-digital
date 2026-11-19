import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Badge, Button } from "./ui";
import { rotuloPapel, type ConteudoSugestao } from "@/lib/crm/copiloto";
import { formatarMoeda, linkWhatsapp, rotuloEtapa } from "@/lib/crm/funil";
import { amanhaAsNove } from "@/lib/crm/agenda";
import { CHAVE_OPS, CHAVE_TAREFAS, chaveAtividades } from "@/lib/crm/consultas";
import type { Json } from "@/integrations/supabase/types";
import { propostaRascunho, sdrPrimeiraMensagem } from "@/lib/crm-ia.functions";

export const CHAVE_SUGESTOES = ["crm-sugestoes"] as const;

export type Sugestao = {
  id: string;
  oportunidade_id: string;
  papel: string;
  acao: string;
  conteudo: ConteudoSugestao;
  created_at: string;
  oportunidade: { nome_empresa: string; whatsapp: string | null; etapa: string } | null;
};

export function useSugestoesPendentes() {
  return useQuery({
    queryKey: CHAVE_SUGESTOES,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_sugestoes_ia")
        .select("id, oportunidade_id, papel, acao, conteudo, created_at, oportunidade:crm_oportunidades(nome_empresa, whatsapp, etapa)")
        .eq("status", "pendente")
        .order("created_at");
      if (error) throw error;
      return data as unknown as Sugestao[];
    },
  });
}

const ORDEM_ETAPA = ["novo", "contatado", "diagnostico_enviado", "proposta", "negociacao"];
const emTresDias = () => { const d = amanhaAsNove(); d.setDate(d.getDate() + 2); return d; };

/** Texto que vai para o WhatsApp numa proposta: mensagem + escopo resumido. */
export function textoDaProposta(c: ConteudoSugestao) {
  const itens = (c.itens ?? []).map((i) => `• ${i.servico}: ${i.entregaveis} (${formatarMoeda(i.valor_mensal)}/mês)`).join("\n");
  return [c.mensagem, itens, c.valor_mensal ? `Total: ${formatarMoeda(c.valor_mensal)}/mês` : ""].filter(Boolean).join("\n\n");
}

/**
 * Aprovar: registra no histórico, avança o funil quando faz sentido e agenda o
 * próximo follow-up em 3 dias. O envio em si é o WhatsApp aberto pelo próprio Victor.
 */
function useResolverSugestao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ s, aprovar, texto }: { s: Sugestao; aprovar: boolean; texto: string }) => {
      const conteudo = { ...s.conteudo, ...(s.acao === "enviar_whatsapp" ? { mensagem: texto } : {}) };
      const { error } = await supabase.from("crm_sugestoes_ia").update({ status: aprovar ? "aprovada" : "descartada", conteudo: conteudo as Json }).eq("id", s.id);
      if (error) throw error;
      if (!aprovar) return;

      const op = s.oportunidade;
      await supabase.from("crm_atividades").insert([
        { oportunidade_id: s.oportunidade_id, tipo: "sugestao_ia_aceita", descricao: `Sugestão do ${rotuloPapel(s.papel)} aprovada`, metadados: { sugestao_id: s.id, papel: s.papel } },
        { oportunidade_id: s.oportunidade_id, tipo: "mensagem_enviada", descricao: texto, metadados: { canal: "whatsapp", sugestao_id: s.id } },
      ]);

      const atual = ORDEM_ETAPA.indexOf(op?.etapa ?? "");
      if (s.acao === "proposta_rascunho") {
        await supabase.from("crm_oportunidades").update({
          valor_mensal: s.conteudo.valor_mensal ?? 0,
          ...(atual >= 0 && atual < ORDEM_ETAPA.indexOf("proposta") ? { etapa: "proposta" } : {}),
        }).eq("id", s.oportunidade_id);
      } else if (op?.etapa === "novo") {
        await supabase.from("crm_oportunidades").update({ etapa: "contatado" }).eq("id", s.oportunidade_id);
      }

      await supabase.from("crm_tarefas").insert({
        oportunidade_id: s.oportunidade_id,
        tipo: "followup",
        descricao: s.acao === "proposta_rascunho" ? "Perguntar o que achou da proposta" : "Ver se respondeu a mensagem",
        vence_em: emTresDias().toISOString(),
        criada_por_ia: true,
      });
    },
    onSettled: (_d, _e, { s }) => {
      qc.invalidateQueries({ queryKey: CHAVE_SUGESTOES });
      qc.invalidateQueries({ queryKey: CHAVE_OPS });
      qc.invalidateQueries({ queryKey: CHAVE_TAREFAS });
      qc.invalidateQueries({ queryKey: chaveAtividades(s.oportunidade_id) });
    },
  });
}

export function CartaoSugestao({ s }: { s: Sugestao }) {
  const resolver = useResolverSugestao();
  const proposta = s.acao === "proposta_rascunho";
  const [texto, setTexto] = useState(() => (proposta ? textoDaProposta(s.conteudo) : s.conteudo.mensagem ?? ""));
  const wa = linkWhatsapp(s.oportunidade?.whatsapp, texto);
  const nome = s.oportunidade?.nome_empresa ?? "Contato";

  return (
    <li className="crm-sugestao">
      <div className="crm-sugestao-top">
        <div>
          <h3 className="crm-cartao-t">{nome}</h3>
          <span className="leads-sub">{s.oportunidade ? rotuloEtapa(s.oportunidade.etapa) : ""}{s.conteudo.dias_parado ? ` · parado há ${s.conteudo.dias_parado} dias` : ""}</span>
        </div>
        <Badge>{rotuloPapel(s.papel)}</Badge>
      </div>
      {s.conteudo.justificativa && <p className="crm-sugestao-por">{s.conteudo.justificativa}</p>}
      {proposta && s.conteudo.resumo && <p className="crm-sugestao-por">{s.conteudo.resumo}</p>}
      <label className="crm-campo">
        <span className="v2-field-label">{proposta ? "Proposta para enviar (edite antes de aprovar)" : "Mensagem (edite antes de aprovar)"}</span>
        <textarea className="leads-nota" rows={proposta ? 9 : 5} value={texto} onChange={(e) => setTexto(e.target.value)} />
      </label>
      <div className="leads-acoes">
        {wa ? (
          <a
            className={`v2-btn v2-btn-secondary v2-btn-sm${resolver.isPending ? " is-disabled" : ""}`}
            href={wa}
            target="_blank"
            rel="noreferrer"
            onClick={() => resolver.mutate({ s, aprovar: true, texto })}
          >
            Aprovar e abrir WhatsApp
          </a>
        ) : (
          <span className="leads-sub">Contato sem WhatsApp cadastrado.</span>
        )}
        {!wa && (
          <Button variant="secondary" size="sm" disabled={resolver.isPending} onClick={() => resolver.mutate({ s, aprovar: true, texto })}>Aprovar sem enviar</Button>
        )}
        <button className="leads-nota-btn" disabled={resolver.isPending} onClick={() => resolver.mutate({ s, aprovar: false, texto })}>Descartar</button>
        {resolver.isError && <span className="crm-erro" role="alert">Não foi possível registrar. Tente de novo.</span>}
      </div>
    </li>
  );
}

export function FilaAprovacao() {
  const fila = useSugestoesPendentes();
  if (fila.isLoading) return <p className="leads-sub">Carregando a fila…</p>;
  if (fila.error) return <p className="leads-sub">Não foi possível carregar a fila de aprovação.</p>;
  if (!fila.data?.length) return <p className="leads-sub">Nada esperando aprovação. Gere a fila do dia ou peça uma mensagem no funil.</p>;
  return <ul className="crm-sugestoes">{fila.data.map((s) => <CartaoSugestao key={s.id} s={s} />)}</ul>;
}

/** Botões do copiloto na gaveta do funil: pedem à IA e mandam o resultado para a fila. */
export function CopilotoDaOportunidade({ oportunidadeId }: { oportunidadeId: string }) {
  const qc = useQueryClient();
  const sdr = useServerFn(sdrPrimeiraMensagem);
  const comercial = useServerFn(propostaRascunho);
  const [estado, setEstado] = useState<{ carregando?: "sdr" | "comercial"; ok?: string; erro?: string }>({});

  async function pedir(qual: "sdr" | "comercial") {
    setEstado({ carregando: qual });
    const r = await (qual === "sdr" ? sdr : comercial)({ data: { oportunidadeId } });
    if (!r.ok) return setEstado({ erro: r.erro });
    qc.invalidateQueries({ queryKey: CHAVE_SUGESTOES });
    setEstado({ ok: qual === "sdr" ? "Mensagem pronta na fila de aprovação." : "Rascunho de proposta pronto na fila de aprovação." });
  }

  return (
    <section className="crm-historico" aria-label="Copiloto">
      <h3 className="leads-bloco-t">Copiloto</h3>
      <div className="leads-acoes">
        <Button variant="secondary" size="sm" disabled={!!estado.carregando} onClick={() => pedir("sdr")}>
          {estado.carregando === "sdr" ? "Escrevendo…" : "Escrever mensagem (SDR)"}
        </Button>
        <Button variant="secondary" size="sm" disabled={!!estado.carregando} onClick={() => pedir("comercial")}>
          {estado.carregando === "comercial" ? "Montando…" : "Rascunho de proposta"}
        </Button>
      </div>
      {estado.ok && <p className="leads-sub" role="status">{estado.ok} <Link to="/crm">Ver a fila</Link></p>}
      {estado.erro && <p className="crm-erro" role="alert">{estado.erro}</p>}
    </section>
  );
}
