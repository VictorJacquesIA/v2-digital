import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CrmShell } from "@/components/v2/crm-nav";
import { CHAVE_SUGESTOES } from "@/components/v2/crm-sugestoes";
import { Badge, Button } from "@/components/v2/ui";
import { CHAVE_OPS } from "@/lib/crm/consultas";
import { importarProspectos, prospectarMaps, type Prospecto } from "@/lib/crm-ia.functions";

export const Route = createFileRoute("/_authenticated/crm/prospeccao")({
  head: () => ({
    meta: [
      { title: "Prospecção — CRM V2 Digital" },
      { name: "description", content: "Busca de empresas no Google Maps com qualificação automática." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProspeccaoPage,
});

const TOM_FAIXA = { alta: "success", media: "warning", baixa: "neutral" } as const;
const ROTULO_FAIXA = { alta: "Oportunidade alta", media: "Oportunidade média", baixa: "Oportunidade baixa" } as const;

function ProspeccaoPage() {
  const qc = useQueryClient();
  const buscar = useServerFn(prospectarMaps);
  const importar = useServerFn(importarProspectos);
  const [nicho, setNicho] = useState("");
  const [regiao, setRegiao] = useState("Imbituba, SC");
  const [busca, setBusca] = useState<{ nicho: string; regiao: string } | null>(null);
  const [lista, setLista] = useState<Prospecto[]>([]);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [estado, setEstado] = useState<{ buscando?: boolean; importando?: boolean; erro?: string; ok?: string }>({});

  async function pesquisar(e: FormEvent) {
    e.preventDefault();
    setEstado({ buscando: true });
    const r = await buscar({ data: { nicho, regiao } });
    if (!r.ok) return setEstado({ erro: r.erro });
    setBusca({ nicho, regiao });
    setLista(r.prospectos);
    // Já marca as boas oportunidades que dá para abordar e ainda não estão no CRM
    setMarcados(new Set(r.prospectos.filter((p) => p.faixa === "alta" && p.telefone && !p.jaNoCrm).map((p) => p.place_id)));
    setEstado({});
  }

  async function importarMarcados() {
    if (!busca) return;
    setEstado({ importando: true });
    const r = await importar({ data: { ...busca, prospectos: lista.filter((p) => marcados.has(p.place_id)) } });
    if (!r.ok) return setEstado({ erro: r.erro });
    qc.invalidateQueries({ queryKey: CHAVE_OPS });
    qc.invalidateQueries({ queryKey: CHAVE_SUGESTOES });
    setLista((l) => l.map((p) => (marcados.has(p.place_id) ? { ...p, jaNoCrm: true } : p)));
    setMarcados(new Set());
    const partes = [`${r.criadas} ${r.criadas === 1 ? "empresa importada" : "empresas importadas"} para o funil`];
    if (r.repetidas) partes.push(`${r.repetidas} já estavam no CRM`);
    if (r.mensagens) partes.push(`${r.mensagens} primeiras mensagens na fila de aprovação`);
    setEstado({ ok: partes.join(" · ") + ".", ...(r.avisoIa ? { erro: r.avisoIa } : {}) });
  }

  const alternar = (id: string) => setMarcados((m) => { const n = new Set(m); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <CrmShell
      titulo="Prospecção no Maps"
      acao={<Button size="sm" onClick={importarMarcados} disabled={!marcados.size || estado.importando}>{estado.importando ? "Importando…" : `Importar selecionadas (${marcados.size})`}</Button>}
    >
      <form className="crm-busca" onSubmit={pesquisar}>
        <label className="crm-campo">
          <span className="v2-field-label">Nicho</span>
          <input className="v2-input" value={nicho} required placeholder="Ex.: imobiliária, pet shop, barbearia" onChange={(e) => setNicho(e.target.value)} />
        </label>
        <label className="crm-campo">
          <span className="v2-field-label">Região</span>
          <input className="v2-input" value={regiao} required onChange={(e) => setRegiao(e.target.value)} />
        </label>
        <Button variant="secondary" size="sm" type="submit" disabled={estado.buscando}>{estado.buscando ? "Buscando…" : "Buscar no Google Maps"}</Button>
      </form>
      <p className="leads-sub">A nota vai de 0 a 100: quanto mais o perfil precisa de ajuda (sem site, poucas avaliações, nota baixa) e dá para contatar, maior. Ao importar, o SDR escreve a primeira mensagem de cada uma para você aprovar na <Link to="/crm">visão geral</Link>.</p>
      {estado.erro && <p className="crm-erro" role="alert">{estado.erro}</p>}
      {estado.ok && <p className="leads-sub" role="status">{estado.ok}</p>}

      {busca && lista.length === 0 && <p className="ds-body">Nenhuma empresa encontrada para “{busca.nicho}” em {busca.regiao}.</p>}
      {lista.length > 0 && (
        <ul className="crm-prospectos">
          {lista.map((p) => (
            <li key={p.place_id} className={`crm-prospecto${p.jaNoCrm ? " crm-prospecto-no-crm" : ""}`}>
              <label className="crm-tarefa-check">
                <input type="checkbox" checked={marcados.has(p.place_id)} disabled={p.jaNoCrm} onChange={() => alternar(p.place_id)} aria-label={`Selecionar ${p.nome}`} />
              </label>
              <div className="crm-tarefa-corpo">
                <span className="crm-tarefa-t">{p.nome}</span>
                <span className="leads-sub">{[p.categoria, p.endereco].filter(Boolean).join(" · ")}</span>
                <span className="leads-sub">
                  {p.nota ? `Nota ${p.nota.toLocaleString("pt-BR")} · ` : ""}{p.avaliacoes} avaliações · {p.telefone ?? "sem telefone"}{p.site ? " · tem site" : ""}
                </span>
                {p.motivos.length > 0 && <span className="crm-prospecto-motivos">{p.motivos.join(" · ")}</span>}
              </div>
              <div className="crm-prospecto-nota">
                <span className="crm-score" aria-label={`Nota de oportunidade ${p.score} de 100`}>{p.score}</span>
                {p.jaNoCrm ? <Badge>Já no CRM</Badge> : <Badge tone={TOM_FAIXA[p.faixa]}>{ROTULO_FAIXA[p.faixa]}</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </CrmShell>
  );
}
