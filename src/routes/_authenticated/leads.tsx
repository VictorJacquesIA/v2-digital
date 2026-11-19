import { Fragment, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/v2/ui";
import { CrmNav } from "@/components/v2/crm-nav";
import { gerarEstrategia, type Estrategia } from "@/lib/leads.functions";
import { tempoRestante } from "@/lib/estrategia-link";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({
    meta: [
      { title: "Contatos do diagnóstico — Painel V2 Digital" },
      { name: "description", content: "CRM privado dos contatos que pediram o diagnóstico gratuito." },
      { property: "og:title", content: "Contatos do diagnóstico — Painel V2 Digital" },
      { property: "og:description", content: "CRM privado dos contatos que pediram o diagnóstico gratuito." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LeadsPage,
});

const STATUS = [
  { v: "novo", r: "Novo" },
  { v: "contatado", r: "Contatado" },
  { v: "proposta", r: "Proposta enviada" },
  { v: "cliente", r: "Cliente fechado" },
  { v: "arquivado", r: "Arquivado" },
] as const;

const ABAS = [
  { r: "Novos leads", s: ["novo"] },
  { r: "Em contato", s: ["contatado", "proposta"] },
  { r: "Clientes fechados", s: ["cliente"] },
  { r: "Arquivados", s: ["arquivado"] },
];

function waLink(numero: string, nome: string | null) {
  const d = numero.replace(/\D/g, "");
  const n = d.startsWith("55") ? d : `55${d}`;
  const t = `Olá${nome ? `, tudo bem? Aqui é da V2 Digital, vi o diagnóstico da ${nome}` : "! Aqui é da V2 Digital, vi seu diagnóstico"} e queria te mostrar como melhorar sua posição no Google.`;
  return `https://wa.me/${n}?text=${encodeURIComponent(t)}`;
}

const data = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

const BLOCOS: { k: keyof Omit<Estrategia, "geradaEm">; t: string }[] = [
  { k: "raioX", t: "1. O raio-X atual" },
  { k: "mapa", t: "2. Como rankear melhor no Google" },
  { k: "ia", t: "3. Como otimizar para inteligência artificial" },
  { k: "plano", t: "4. O plano de ação da V2" },
];

function LeadsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const gerar = useServerFn(gerarEstrategia);
  const [aba, setAba] = useState(0);
  const [notaAberta, setNotaAberta] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");
  const [modal, setModal] = useState<{ id: string; nome: string; whatsapp: string; est?: Estrategia; token?: string | null; expira?: string | null; erro?: string; carregando?: boolean } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const admin = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user?.id ?? "").eq("role", "admin");
      return { ok: (data?.length ?? 0) > 0, email: u.user?.email ?? "" };
    },
  });
  const leads = useQuery({
    queryKey: ["leads"],
    enabled: !!admin.data?.ok,
    queryFn: async () => {
      const { data, error } = await supabase.from("leads_diagnostico").select("*").order("ultima_interacao", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function sair() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  async function atualizar(id: string, campos: { status?: string; notas?: string }) {
    const extra = campos.status ? { atendido: campos.status !== "novo" } : {};
    await supabase.from("leads_diagnostico").update({ ...campos, ...extra }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["leads"] });
  }
  type LeadRow = { id: string; business_name: string | null; whatsapp: string; estrategia: unknown; estrategia_token: string | null; estrategia_expira: string | null };
  async function abrirEstrategia(l: LeadRow, novo = false) {
    setCopiado(false);
    const base = { id: l.id, nome: l.business_name || "Negócio", whatsapp: l.whatsapp };
    if (l.estrategia && !novo) return setModal({ ...base, est: l.estrategia as Estrategia, token: l.estrategia_token, expira: l.estrategia_expira });
    setModal({ ...base, carregando: true });
    const r = await gerar({ data: { leadId: l.id } });
    if (r.ok) { setModal({ ...base, est: r.estrategia, token: r.token, expira: r.expira }); qc.invalidateQueries({ queryKey: ["leads"] }); }
    else setModal({ ...base, erro: r.erro });
  }
  const linkDe = (token: string) => `${window.location.origin}/estrategia/${token}`;
  async function copiar(token: string) {
    await navigator.clipboard.writeText(linkDe(token));
    setCopiado(true);
  }
  function waEstrategia(numero: string, nome: string, token: string) {
    const d = numero.replace(/\D/g, "");
    const n = d.startsWith("55") ? d : `55${d}`;
    const t = `Olá! Aqui é da V2 Digital. Preparamos uma estratégia exclusiva para a ${nome}. Ela fica disponível por 3 dias neste link: ${linkDe(token)}`;
    return `https://wa.me/${n}?text=${encodeURIComponent(t)}`;
  }

  const todos = leads.data ?? [];
  const visiveis = todos.filter((l) => ABAS[aba]!.s.includes(l.status));

  return (
    <main className="leads-page">
      <header className="leads-top">
        <div>
          <span className="v2-overline site-overline">Painel</span>
          <h1 className="ds-h1">Contatos do diagnóstico</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={sair}>Sair</Button>
      </header>
      <CrmNav />
      {admin.isLoading && <p className="ds-body">Carregando…</p>}
      {admin.data && !admin.data.ok && <p className="ds-body">A conta {admin.data.email} não tem acesso a este painel.</p>}
      {leads.error && <p className="ds-body">Não foi possível carregar os contatos.</p>}

      {leads.data && (
        <div className="v2-tabs">
          <div className="v2-tablist" role="tablist">
            {ABAS.map((a, i) => (
              <button key={a.r} role="tab" aria-selected={i === aba} className={`v2-tab${i === aba ? " v2-tab-on" : ""}`} onClick={() => setAba(i)}>
                {a.r} <span className="leads-conta">{todos.filter((l) => a.s.includes(l.status)).length}</span>
              </button>
            ))}
          </div>
          {visiveis.length === 0 ? (
            <p className="ds-body leads-vazio">Nenhum contato nesta aba.</p>
          ) : (
            <div className="leads-tabela-wrap">
              <table className="leads-tabela">
                <thead>
                  <tr><th>Última interação</th><th>Negócio</th><th>WhatsApp</th><th>Nota</th><th>Posição</th><th>Status</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {visiveis.map((l) => (
                    <Fragment key={l.id}>
                      <tr>
                        <td>
                          {data(l.ultima_interacao)}
                          {l.interacoes > 1 && <span className="leads-sub">Solicitou {l.interacoes} vezes</span>}
                        </td>
                        <td>{l.maps_url ? <a href={l.maps_url} target="_blank" rel="noreferrer">{l.business_name || "Ver no Maps"}</a> : l.business_name || "—"}</td>
                        <td>{l.whatsapp}</td>
                        <td>{l.indice ?? "—"}</td>
                        <td>{l.posicao ?? "—"}</td>
                        <td>
                          <select className="leads-status" aria-label="Status do contato" value={l.status} onChange={(e) => atualizar(l.id, { status: e.target.value })}>
                            {STATUS.map((s) => <option key={s.v} value={s.v}>{s.r}</option>)}
                          </select>
                        </td>
                        <td>
                          <div className="leads-acoes">
                            <Button variant="secondary" size="sm" href={waLink(l.whatsapp, l.business_name)}>WhatsApp</Button>
                            <Button variant="secondary" size="sm" onClick={() => abrirEstrategia(l)}>
                              {l.estrategia ? "Ver estratégia" : "Gerar estratégia de IA"}
                            </Button>
                            <button className="leads-nota-btn" onClick={() => { setNotaAberta(notaAberta === l.id ? null : l.id); setRascunho(l.notas ?? ""); }}>
                              {l.notas ? "Notas •" : "Notas"}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {notaAberta === l.id && (
                        <tr className="leads-nota-linha">
                          <td colSpan={7}>
                            <textarea className="leads-nota" rows={3} placeholder="Anotações internas sobre este contato" value={rascunho} onChange={(e) => setRascunho(e.target.value)} />
                            <div className="leads-acoes">
                              <Button variant="secondary" size="sm" onClick={async () => { await atualizar(l.id, { notas: rascunho }); setNotaAberta(null); }}>Salvar nota</Button>
                              <button className="leads-nota-btn" onClick={() => setNotaAberta(null)}>Cancelar</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="leads-modal-fundo" role="dialog" aria-modal="true" aria-label="Estratégia de IA" onClick={() => setModal(null)}>
          <div className="leads-modal" onClick={(e) => e.stopPropagation()}>
            <div className="leads-top">
              <div>
                <span className="v2-overline site-overline">Estratégia de IA</span>
                <h2 className="ds-h3">{modal.nome}</h2>
              </div>
              <button className="leads-nota-btn" onClick={() => setModal(null)}>Fechar</button>
            </div>
            {modal.carregando && <p className="ds-body">Gerando a estratégia com os dados do Google… isso leva alguns segundos.</p>}
            {modal.erro && <p className="ds-body">{modal.erro}</p>}
            {modal.est && (
              <>
                {BLOCOS.map((b) => (
                  <section key={b.k} className="leads-bloco">
                    <h3 className="leads-bloco-t">{b.t}</h3>
                    <p className="leads-bloco-txt">{modal.est![b.k]}</p>
                  </section>
                ))}
                <p className="leads-sub">Gerada em {data(modal.est.geradaEm)}{modal.token ? ` · Link: ${tempoRestante(modal.expira)}` : ""}</p>
                {modal.token && <p className="leads-sub">{linkDe(modal.token)}</p>}
                <div className="leads-acoes">
                  {modal.token && tempoRestante(modal.expira) !== "Expirado" ? (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => copiar(modal.token!)}>{copiado ? "Link copiado" : "Copiar link do cliente"}</Button>
                      <Button variant="secondary" size="sm" href={waEstrategia(modal.whatsapp, modal.nome, modal.token)}>Enviar link no WhatsApp</Button>
                    </>
                  ) : (
                    <span className="leads-sub">Link expirado ou inexistente — gere de novo para criar um novo link de 3 dias.</span>
                  )}
                  <button className="leads-nota-btn" onClick={() => {
                    const l = todos.find((x) => x.id === modal.id);
                    if (l) abrirEstrategia(l, true);
                  }}>Gerar de novo</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
