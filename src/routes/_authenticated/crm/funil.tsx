import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { CrmShell } from "@/components/v2/crm-nav";
import { Badge, Button } from "@/components/v2/ui";
import {
  ETAPAS,
  MOTIVOS_PERDA,
  ORIGENS,
  SERVICOS,
  agruparPorEtapa,
  camposDaMudanca,
  diasNaEtapa,
  ehEtapa,
  estaEsfriando,
  formatarMoeda,
  linkWhatsapp,
  receitaPrevista,
  rotuloEtapa,
  rotuloOrigem,
  totaisPorEtapa,
  valorNumerico,
  type Etapa,
  type Oportunidade,
} from "@/lib/crm/funil";
import { CHAVE_OPS, chaveAtividades, useOportunidades } from "@/lib/crm/consultas";
import { TarefasDaOportunidade } from "@/components/v2/crm-tarefas";
import { CopilotoDaOportunidade } from "@/components/v2/crm-sugestoes";

export const Route = createFileRoute("/_authenticated/crm/funil")({
  head: () => ({
    meta: [
      { title: "Funil — CRM V2 Digital" },
      { name: "description", content: "Funil de vendas da V2 Digital." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: FunilPage,
});

const CHAVE = CHAVE_OPS;

function FunilPage() {
  const [nova, setNova] = useState(false);
  return (
    <CrmShell titulo="Funil de vendas" acao={<Button size="sm" onClick={() => setNova(true)}>Nova oportunidade</Button>}>
      <Funil />
      {nova && <ModalNova onFechar={() => setNova(false)} />}
    </CrmShell>
  );
}

function useMoverEtapa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, para, motivo }: { id: string; para: Etapa; motivo?: string }) => {
      const { error } = await supabase.from("crm_oportunidades").update(camposDaMudanca(para, motivo)).eq("id", id);
      if (error) throw error;
    },
    // Move o cartão na hora; se o banco recusar, volta para a coluna de antes
    onMutate: async ({ id, para, motivo }) => {
      await qc.cancelQueries({ queryKey: CHAVE });
      const antes = qc.getQueryData<Oportunidade[]>(CHAVE);
      qc.setQueryData<Oportunidade[]>(CHAVE, (ops) =>
        ops?.map((o) => (o.id === id ? { ...o, etapa: para, etapa_desde: new Date().toISOString(), motivo_perda: para === "perdido" ? motivo ?? null : null } : o)),
      );
      return { antes };
    },
    onError: (_e, _v, ctx) => ctx?.antes && qc.setQueryData(CHAVE, ctx.antes),
    onSettled: (_d, _e, { id }) => {
      qc.invalidateQueries({ queryKey: CHAVE });
      qc.invalidateQueries({ queryKey: chaveAtividades(id) });
    },
  });
}

function Funil() {
  const ops = useOportunidades();
  const mover = useMoverEtapa();
  const [arrastando, setArrastando] = useState<Oportunidade | null>(null);
  const [aberta, setAberta] = useState<string | null>(null);
  const [perda, setPerda] = useState<Oportunidade | null>(null);

  // Toque: segura ~0,2 s para arrastar, assim a rolagem lateral continua funcionando no celular
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const lista = ops.data ?? [];
  const grupos = useMemo(() => agruparPorEtapa(lista), [lista]);
  const totais = useMemo(() => totaisPorEtapa(lista), [lista]);
  const selecionada = lista.find((o) => o.id === aberta) ?? null;

  function soltar(e: DragEndEvent) {
    setArrastando(null);
    const op = lista.find((o) => o.id === e.active.id);
    const para = e.over?.id;
    if (!op || !ehEtapa(para) || para === op.etapa) return;
    if (para === "perdido") setPerda(op);
    else mover.mutate({ id: op.id, para });
  }

  if (ops.isLoading) return <p className="ds-body">Carregando o funil…</p>;
  if (ops.error) return <p className="ds-body">Não foi possível carregar as oportunidades. Confira se a migração do CRM foi aplicada no Supabase.</p>;

  return (
    <>
      <p className="crm-resumo">
        {lista.filter((o) => o.etapa !== "fechado" && o.etapa !== "perdido").length} oportunidades em aberto ·
        {" "}Receita prevista {formatarMoeda(receitaPrevista(lista))}/mês
        {mover.isError && <span className="crm-erro"> · Não foi possível mover o cartão. Tente de novo.</span>}
      </p>
      <DndContext
        sensors={sensores}
        onDragStart={(e) => setArrastando(lista.find((o) => o.id === e.active.id) ?? null)}
        onDragCancel={() => setArrastando(null)}
        onDragEnd={soltar}
      >
        <div className="crm-kanban" role="list" aria-label="Etapas do funil">
          {ETAPAS.map((et) => (
            <Coluna key={et.v} etapa={et.v} titulo={et.r} quantidade={totais[et.v].quantidade} valor={totais[et.v].valor}>
              {grupos[et.v].map((op) => (
                <Cartao key={op.id} op={op} onAbrir={() => setAberta(op.id)} />
              ))}
            </Coluna>
          ))}
        </div>
        <DragOverlay>{arrastando && <CartaoConteudo op={arrastando} flutuando />}</DragOverlay>
      </DndContext>

      {selecionada && (
        <Gaveta
          op={selecionada}
          onFechar={() => setAberta(null)}
          onMover={(para) => (para === "perdido" ? setPerda(selecionada) : mover.mutate({ id: selecionada.id, para }))}
        />
      )}
      {perda && (
        <ModalPerda
          nome={perda.nome_empresa}
          onCancelar={() => setPerda(null)}
          onConfirmar={(motivo) => {
            mover.mutate({ id: perda.id, para: "perdido", motivo });
            setPerda(null);
          }}
        />
      )}
    </>
  );
}

function Coluna({ etapa, titulo, quantidade, valor, children }: { etapa: Etapa; titulo: string; quantidade: number; valor: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  return (
    <section ref={setNodeRef} role="listitem" aria-label={`${titulo}: ${quantidade}`} className={`crm-coluna${isOver ? " crm-coluna-alvo" : ""}`}>
      <header className="crm-coluna-top">
        <h2 className="crm-coluna-t">{titulo} <span className="leads-conta">{quantidade}</span></h2>
        <span className="crm-coluna-valor">{formatarMoeda(valor)}</span>
      </header>
      <div className="crm-coluna-cartoes">{children}</div>
    </section>
  );
}

function Cartao({ op, onAbrir }: { op: Oportunidade; onAbrir: () => void }) {
  // O cartão fica no lugar (apagado) enquanto a cópia flutuante do DragOverlay acompanha o ponteiro
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: op.id });
  return (
    <div
      ref={setNodeRef}
      className={`crm-cartao-wrap${isDragging ? " crm-cartao-fantasma" : ""}`}
      {...attributes}
      {...listeners}
      aria-roledescription="cartão arrastável"
      aria-label={`${op.nome_empresa}, ${rotuloEtapa(op.etapa)}. Enter abre os detalhes; espaço pega o cartão para mover.`}
      onKeyDown={(e) => {
        if (e.key === "Enter") onAbrir();
        else listeners?.["onKeyDown"]?.(e);
      }}
      onClick={onAbrir}
    >
      <CartaoConteudo op={op} />
    </div>
  );
}

function CartaoConteudo({ op, flutuando }: { op: Oportunidade; flutuando?: boolean }) {
  const dias = diasNaEtapa(op.etapa_desde);
  const valor = valorNumerico(op.valor_mensal);
  return (
    <article className={`crm-cartao${flutuando ? " crm-cartao-flutuando" : ""}`}>
      <h3 className="crm-cartao-t">{op.nome_empresa}</h3>
      {(op.nome_contato || op.nicho) && <p className="crm-cartao-sub">{[op.nome_contato, op.nicho].filter(Boolean).join(" · ")}</p>}
      <div className="crm-cartao-meta">
        <Badge>{rotuloOrigem(op.origem)}</Badge>
        <Badge tone={estaEsfriando(op) ? "warning" : "neutral"}>{dias === 0 ? "Hoje" : `${dias} ${dias === 1 ? "dia" : "dias"}`}</Badge>
        {valor > 0 && <span className="crm-cartao-valor">{formatarMoeda(valor)}</span>}
      </div>
      {op.etapa === "perdido" && op.motivo_perda && <p className="crm-cartao-sub">Motivo: {op.motivo_perda}</p>}
    </article>
  );
}

/* ── Gaveta com dados e linha do tempo ─────────────────────────────── */

type Atividade = { id: string; tipo: string; descricao: string; metadados: Record<string, unknown> | null; created_at: string };
const quando = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function descreverAtividade(a: Atividade) {
  if (a.tipo === "mudanca_etapa") {
    const m = a.metadados ?? {};
    const motivo = typeof m["motivo_perda"] === "string" && m["para"] === "perdido" ? ` (${m["motivo_perda"]})` : "";
    return `${rotuloEtapa(String(m["de"] ?? ""))} → ${rotuloEtapa(String(m["para"] ?? ""))}${motivo}`;
  }
  return a.descricao;
}

function Gaveta({ op, onFechar, onMover }: { op: Oportunidade; onFechar: () => void; onMover: (para: Etapa) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(() => paraForm(op));
  const [nota, setNota] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => setForm(paraForm(op)), [op]);
  const fechar = useFecharComEsc(onFechar);

  const atividades = useQuery({
    queryKey: chaveAtividades(op.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_atividades")
        .select("id, tipo, descricao, metadados, created_at")
        .eq("oportunidade_id", op.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Atividade[];
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_oportunidades").update(doForm(form)).eq("id", op.id);
      if (error) throw error;
    },
    onSuccess: () => { setMsg("Alterações salvas."); qc.invalidateQueries({ queryKey: CHAVE }); },
    onError: (e) => setMsg(mensagemDeErro(e)),
  });

  const anotar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_atividades").insert({ oportunidade_id: op.id, tipo: "nota", descricao: nota.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setNota(""); qc.invalidateQueries({ queryKey: chaveAtividades(op.id) }); },
  });

  const wa = linkWhatsapp(form.whatsapp);
  return (
    <div className="leads-modal-fundo" onClick={fechar}>
      <aside className="crm-gaveta" role="dialog" aria-modal="true" aria-labelledby="crm-gaveta-t" onClick={(e) => e.stopPropagation()}>
        <div className="leads-top">
          <div>
            <span className="v2-overline site-overline">{rotuloEtapa(op.etapa)} · {rotuloOrigem(op.origem)}</span>
            <h2 id="crm-gaveta-t" className="ds-h3">{op.nome_empresa}</h2>
          </div>
          <button className="leads-nota-btn" onClick={fechar} autoFocus>Fechar</button>
        </div>

        <div className="crm-gaveta-acoes">
          <label className="crm-mover">
            <span className="v2-field-label">Etapa</span>
            <select className="leads-status" value={op.etapa} onChange={(e) => ehEtapa(e.target.value) && onMover(e.target.value)}>
              {ETAPAS.map((e) => <option key={e.v} value={e.v}>{e.r}</option>)}
            </select>
          </label>
          {wa && <Button variant="secondary" size="sm" href={wa}>Abrir WhatsApp</Button>}
        </div>

        <form className="crm-form" onSubmit={(e) => { e.preventDefault(); setMsg(null); salvar.mutate(); }}>
          <CampoTexto label="Empresa" valor={form.nome_empresa} obrigatorio onMudar={(v) => setForm({ ...form, nome_empresa: v })} />
          <CampoTexto label="Contato" valor={form.nome_contato} onMudar={(v) => setForm({ ...form, nome_contato: v })} />
          <CampoTexto label="WhatsApp" valor={form.whatsapp} tipo="tel" onMudar={(v) => setForm({ ...form, whatsapp: v })} />
          <CampoTexto label="Nicho" valor={form.nicho} onMudar={(v) => setForm({ ...form, nicho: v })} />
          <CampoTexto label="Região" valor={form.regiao} onMudar={(v) => setForm({ ...form, regiao: v })} />
          <CampoTexto label="Valor mensal (R$)" valor={form.valor_mensal} tipo="number" onMudar={(v) => setForm({ ...form, valor_mensal: v })} />
          <fieldset className="crm-servicos">
            <legend className="v2-field-label">Serviços de interesse</legend>
            {SERVICOS.map((s) => (
              <label key={s} className="crm-servico">
                <input
                  type="checkbox"
                  checked={form.servicos.includes(s)}
                  onChange={(e) => setForm({ ...form, servicos: e.target.checked ? [...form.servicos, s] : form.servicos.filter((x) => x !== s) })}
                />
                {s}
              </label>
            ))}
          </fieldset>
          <div className="leads-acoes">
            <Button variant="secondary" size="sm" type="submit" disabled={salvar.isPending}>{salvar.isPending ? "Salvando…" : "Salvar alterações"}</Button>
            {msg && <span className="leads-sub" role="status">{msg}</span>}
          </div>
        </form>

        <CopilotoDaOportunidade oportunidadeId={op.id} />

        <TarefasDaOportunidade oportunidadeId={op.id} />

        <section className="crm-historico" aria-label="Histórico">
          <h3 className="leads-bloco-t">Histórico</h3>
          <form className="crm-nota" onSubmit={(e) => { e.preventDefault(); if (nota.trim()) anotar.mutate(); }}>
            <textarea className="leads-nota" rows={2} placeholder="Registrar uma nota" value={nota} onChange={(e) => setNota(e.target.value)} />
            <Button variant="secondary" size="sm" type="submit" disabled={!nota.trim() || anotar.isPending}>Adicionar nota</Button>
          </form>
          {atividades.isLoading && <p className="leads-sub">Carregando histórico…</p>}
          <ol className="crm-linha">
            {(atividades.data ?? []).map((a) => (
              <li key={a.id}>
                <span className="leads-sub">{quando(a.created_at)}</span>
                <span className="crm-linha-txt">{descreverAtividade(a)}</span>
              </li>
            ))}
          </ol>
        </section>
      </aside>
    </div>
  );
}

/* ── Formulários ───────────────────────────────────────────────────── */

type Form = { nome_empresa: string; nome_contato: string; whatsapp: string; nicho: string; regiao: string; valor_mensal: string; servicos: string[] };
const paraForm = (o: Oportunidade): Form => ({
  nome_empresa: o.nome_empresa,
  nome_contato: o.nome_contato ?? "",
  whatsapp: o.whatsapp ?? "",
  nicho: o.nicho ?? "",
  regiao: o.regiao ?? "",
  valor_mensal: String(valorNumerico(o.valor_mensal) || ""),
  servicos: o.servicos_interesse ?? [],
});
const vazioOuNulo = (s: string) => s.trim() || null;
const doForm = (f: Form) => ({
  nome_empresa: f.nome_empresa.trim(),
  nome_contato: vazioOuNulo(f.nome_contato),
  whatsapp: vazioOuNulo(f.whatsapp),
  nicho: vazioOuNulo(f.nicho),
  regiao: vazioOuNulo(f.regiao),
  valor_mensal: Math.max(0, valorNumerico(f.valor_mensal)),
  servicos_interesse: f.servicos,
});

function mensagemDeErro(e: unknown) {
  const code = (e as { code?: string })?.code;
  if (code === "23505") return "Já existe uma oportunidade com este WhatsApp ou negócio do Maps.";
  return "Não foi possível salvar. Tente de novo.";
}

function CampoTexto({ label, valor, onMudar, tipo = "text", obrigatorio }: { label: string; valor: string; onMudar: (v: string) => void; tipo?: string; obrigatorio?: boolean }) {
  return (
    <label className="crm-campo">
      <span className="v2-field-label">{label}</span>
      <input
        className="v2-input"
        type={tipo}
        value={valor}
        required={obrigatorio}
        {...(tipo === "number" ? { min: 0, step: "0.01", inputMode: "decimal" as const } : {})}
        onChange={(e) => onMudar(e.target.value)}
      />
    </label>
  );
}

function useFecharComEsc(onFechar: () => void) {
  const ref = useRef(onFechar);
  ref.current = onFechar;
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && ref.current();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  return () => ref.current();
}

function ModalNova({ onFechar }: { onFechar: () => void }) {
  const qc = useQueryClient();
  const fechar = useFecharComEsc(onFechar);
  const [form, setForm] = useState<Form & { origem: string }>({ nome_empresa: "", nome_contato: "", whatsapp: "", nicho: "", regiao: "", valor_mensal: "", servicos: [], origem: "manual" });
  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("crm_oportunidades").insert({ ...doForm(form), origem: form.origem });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: CHAVE }); onFechar(); },
  });

  function enviar(e: FormEvent) {
    e.preventDefault();
    criar.mutate();
  }

  return (
    <div className="leads-modal-fundo" onClick={fechar}>
      <div className="leads-modal" role="dialog" aria-modal="true" aria-labelledby="crm-nova-t" onClick={(e) => e.stopPropagation()}>
        <div className="leads-top">
          <h2 id="crm-nova-t" className="ds-h3">Nova oportunidade</h2>
          <button className="leads-nota-btn" onClick={fechar}>Fechar</button>
        </div>
        <form className="crm-form" onSubmit={enviar}>
          <CampoTexto label="Empresa" valor={form.nome_empresa} obrigatorio onMudar={(v) => setForm({ ...form, nome_empresa: v })} />
          <CampoTexto label="Contato" valor={form.nome_contato} onMudar={(v) => setForm({ ...form, nome_contato: v })} />
          <CampoTexto label="WhatsApp" valor={form.whatsapp} tipo="tel" onMudar={(v) => setForm({ ...form, whatsapp: v })} />
          <CampoTexto label="Nicho" valor={form.nicho} onMudar={(v) => setForm({ ...form, nicho: v })} />
          <CampoTexto label="Região" valor={form.regiao} onMudar={(v) => setForm({ ...form, regiao: v })} />
          <CampoTexto label="Valor mensal (R$)" valor={form.valor_mensal} tipo="number" onMudar={(v) => setForm({ ...form, valor_mensal: v })} />
          <label className="crm-campo">
            <span className="v2-field-label">Origem</span>
            <select className="leads-status" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })}>
              {ORIGENS.filter((o) => o.v !== "diagnostico").map((o) => <option key={o.v} value={o.v}>{o.r}</option>)}
            </select>
          </label>
          <div className="leads-acoes">
            <Button variant="secondary" size="sm" type="submit" disabled={criar.isPending}>{criar.isPending ? "Criando…" : "Criar oportunidade"}</Button>
            {criar.isError && <span className="crm-erro" role="alert">{mensagemDeErro(criar.error)}</span>}
          </div>
        </form>
      </div>
    </div>
  );
}

function ModalPerda({ nome, onCancelar, onConfirmar }: { nome: string; onCancelar: () => void; onConfirmar: (motivo: string) => void }) {
  const fechar = useFecharComEsc(onCancelar);
  const [motivo, setMotivo] = useState<string>(MOTIVOS_PERDA[0]);
  const [outro, setOutro] = useState("");
  const final = motivo === "Outro" ? outro.trim() : motivo;
  return (
    <div className="leads-modal-fundo" onClick={fechar}>
      <div className="leads-modal crm-modal-curto" role="dialog" aria-modal="true" aria-labelledby="crm-perda-t" onClick={(e) => e.stopPropagation()}>
        <h2 id="crm-perda-t" className="ds-h3">Marcar {nome} como perdido</h2>
        <form className="crm-form" onSubmit={(e) => { e.preventDefault(); if (final) onConfirmar(final); }}>
          <label className="crm-campo">
            <span className="v2-field-label">Motivo da perda</span>
            <select className="leads-status" value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus>
              {MOTIVOS_PERDA.map((m) => <option key={m}>{m}</option>)}
            </select>
          </label>
          {motivo === "Outro" && <CampoTexto label="Qual?" valor={outro} obrigatorio onMudar={setOutro} />}
          <div className="leads-acoes">
            <Button variant="secondary" size="sm" type="submit" disabled={!final}>Confirmar</Button>
            <button type="button" className="leads-nota-btn" onClick={fechar}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
