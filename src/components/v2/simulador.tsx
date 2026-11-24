import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Badge, Button, Input } from "./ui";
import { whatsappLink } from "@/lib/contact";
import { AUDITORIA, RESULTADO } from "@/lib/content";
import { CAPTURA_FALHOU, NOME_INVALIDO, WHATSAPP_INVALIDO, nomeValido, whatsappValido } from "@/lib/lead";
import { analisarPerfil, sugerirEmpresas, type SimResultado, type Sugestao } from "@/lib/simulador.functions";

export const EMPRESA_INVALIDA = "Escolha sua empresa na lista ou cole o link do Google Maps.";

function novaSessao(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Campo com sugestões do Google enquanto a pessoa digita o nome da empresa. */
function BuscaEmpresa({
  escolhida,
  onEscolher,
  sessao,
  erro,
}: {
  escolhida: Sugestao | null;
  onEscolher: (s: Sugestao | null) => void;
  sessao: string;
  erro?: string | undefined;
}) {
  const buscar = useServerFn(sugerirEmpresas);
  const id = useId();
  const [texto, setTexto] = useState("");
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [aberta, setAberta] = useState(false);
  const [ativa, setAtiva] = useState(-1);
  const [aviso, setAviso] = useState("");
  const [buscando, setBuscando] = useState(false);
  const ultima = useRef(0);

  useEffect(() => {
    const termo = texto.trim();
    if (escolhida || termo.length < 3) {
      setSugestoes([]);
      setAviso("");
      return;
    }
    const pedido = ++ultima.current;
    const t = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await buscar({ data: { texto: termo, sessao } });
        if (pedido !== ultima.current) return;
        if (r.ok) {
          setSugestoes(r.sugestoes);
          setAviso(r.sugestoes.length ? "" : "Nenhuma empresa encontrada com esse nome. Tente com a cidade ou cole o link.");
        } else {
          setSugestoes([]);
          setAviso(r.erro);
        }
        setAberta(true);
        setAtiva(-1);
      } catch {
        if (pedido === ultima.current) setAviso("A busca pelo nome não respondeu agora. Cole o link do Google Maps.");
      } finally {
        if (pedido === ultima.current) setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [texto, escolhida, sessao, buscar]);

  function escolher(s: Sugestao) {
    onEscolher(s);
    setAberta(false);
    setSugestoes([]);
  }

  function teclas(e: KeyboardEvent<HTMLInputElement>) {
    if (!aberta || sugestoes.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtiva((a) => (a + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtiva((a) => (a <= 0 ? sugestoes.length - 1 : a - 1));
    } else if (e.key === "Enter" && ativa >= 0) {
      e.preventDefault();
      escolher(sugestoes[ativa]!);
    } else if (e.key === "Escape") {
      setAberta(false);
    }
  }

  if (escolhida) {
    return (
      <div className="v2-field sim-busca">
        <span className="v2-field-label">Sua empresa no Google</span>
        <div className="sim-escolhida">
          <div>
            <strong>{escolhida.nome}</strong>
            <span>{escolhida.endereco}</span>
          </div>
          <button type="button" className="sim-link-btn" onClick={() => { onEscolher(null); setTexto(""); }}>
            Trocar
          </button>
        </div>
      </div>
    );
  }

  const listaId = `${id}-lista`;
  return (
    <div className={`v2-field sim-busca${erro ? " v2-field-error" : ""}`}>
      <label className="v2-field-label" htmlFor={id}>Sua empresa no Google</label>
      <input
        id={id}
        className="v2-input"
        name="empresa"
        placeholder="Digite o nome da empresa"
        autoComplete="off"
        role="combobox"
        aria-expanded={aberta && sugestoes.length > 0}
        aria-controls={listaId}
        aria-autocomplete="list"
        aria-activedescendant={ativa >= 0 ? `${listaId}-${ativa}` : undefined}
        aria-invalid={!!erro}
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setAberta(true); }}
        onKeyDown={teclas}
        onFocus={() => setAberta(true)}
        onBlur={() => setTimeout(() => setAberta(false), 150)}
      />
      {aberta && sugestoes.length > 0 ? (
        <ul className="sim-sugestoes" id={listaId} role="listbox">
          {sugestoes.map((s, i) => (
            <li
              key={s.placeId}
              id={`${listaId}-${i}`}
              role="option"
              aria-selected={i === ativa}
              className={`sim-sugestao${i === ativa ? " sim-sugestao-ativa" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); escolher(s); }}
            >
              <strong>{s.nome}</strong>
              <span>{s.endereco}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {erro ? (
        <span className="v2-field-msg">{erro}</span>
      ) : (
        <span className="v2-field-hint" aria-live="polite">
          {buscando ? "Procurando no Google..." : aviso || "Escreva o nome como aparece no Google. Se precisar, junte a cidade."}
        </span>
      )}
    </div>
  );
}
import {
  diasDesde,
  explicacaoCurta,
  haQuanto,
  qtdAvaliacoes,
  type SimReport,
  type SimStatus,
} from "@/lib/simulador-score";

/** ✓ ou — numa célula de comparação; vazio quando o dado não veio (diagnóstico antigo). */
function marca(v: boolean | undefined): string {
  return v === undefined ? "" : v ? "✓" : "—";
}

const ETAPAS = [
  "Encontrando seu perfil no Google...",
  "Buscando nota e avaliações reais...",
  "Comparando com concorrentes da sua cidade...",
  "Perguntando à IA quem ela indica...",
  "Conferindo o seu site...",
];

const TONS: Record<SimStatus, "success" | "warning" | "danger"> = {
  ok: "success",
  melhorar: "warning",
  critico: "danger",
};

const ROTULOS: Record<SimStatus, string> = {
  ok: "OK",
  melhorar: "Melhorar",
  critico: "Crítico",
};

function notaTexto(nota: number | null): string {
  return nota === null ? "sem nota" : nota.toFixed(1).replace(".", ",");
}

/** Faltam X avaliações para a média do Top 3; "0" quando já alcançou. */
function faltamAvaliacoes(r: SimReport): number {
  return Math.max(0, r.mediaTop3 - r.avaliacoes);
}

/** Os 3 itens que mais pesam, na ordem de prioridade do roteiro. */
function oQuePesa(r: SimReport) {
  const itens: { titulo: string; texto: string; status: SimStatus }[] = [];
  const criterio = (nome: string) => r.criterios.find((c) => c.criterio === nome);

  const avaliacoes = criterio("Quantidade de avaliações");
  if (avaliacoes && avaliacoes.status !== "ok") {
    itens.push({
      titulo: "Volume de avaliações",
      texto: explicacaoCurta(avaliacoes, r),
      status: avaliacoes.status,
    });
  }

  if (r.posicaoStatus !== "ok") {
    itens.push({
      titulo: "Posição no Google",
      texto: RESULTADO.posicaoFrase,
      status: r.posicaoStatus,
    });
  }

  const midia = criterio("Fotos e horários");
  if (midia && midia.status !== "ok") {
    itens.push({ titulo: "Fotos e horários", texto: explicacaoCurta(midia, r), status: midia.status });
  }

  const ia = criterio("Presença nas respostas de IA");
  if (ia && ia.status !== "ok") {
    itens.push({
      titulo: "Perfil incompleto para as IAs",
      texto: explicacaoCurta(ia, r),
      status: ia.status,
    });
  }

  for (const nome of ["Nota em estrelas", "Site próprio"]) {
    const c = criterio(nome);
    if (c && c.status !== "ok") {
      itens.push({ titulo: nome, texto: explicacaoCurta(c, r), status: c.status });
    }
  }

  return itens.slice(0, 3);
}

/** Texto do botão vermelho: cita o volume atual e a meta, nunca posição certa. */
function ctaTexto(r: SimReport): string {
  if (r.posicao !== null && r.posicao <= 3) {
    return "Quero o plano para manter minha empresa no Top 3 e receber mais ligações";
  }
  if (r.mediaTop3 > r.avaliacoes && r.buscaUsada) {
    return `Quero o plano para sair de ${r.avaliacoes} para ${r.mediaTop3}+ avaliações e chegar ao Top 3`;
  }
  return "Quero o plano para chegar ao Top 3 da minha cidade";
}

function dataCurta(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" });
}

/** Bloco para guardar o diagnóstico: link público e versão para salvar em PDF. */
function GuardarDiagnostico({ token }: { token: string }) {
  const caminho = `/diagnostico/${token}`;
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${caminho}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }
  return (
    <div className="sim-guardar sim-nao-imprimir">
      <div>
        <p className="sim-guardar-titulo">Guarde este diagnóstico</p>
        <p className="sim-guardar-texto">Abra pelo link quando quiser, mande para um sócio ou salve em PDF.</p>
      </div>
      <div className="sim-guardar-acoes">
        <Button variant="secondary" size="sm" href={caminho}>Abrir e salvar em PDF</Button>
        <button type="button" className="sim-link-btn" onClick={copiar} aria-live="polite">
          {copiado ? "Link copiado" : "Copiar link"}
        </button>
      </div>
    </div>
  );
}

export function Relatorio({ r, token }: { r: SimReport; token?: string | undefined }) {
  const pesam = oQuePesa(r);
  const faltam = faltamAvaliacoes(r);
  const gerado = dataCurta(r.geradoEm);
  // Fotos, site e horário dos concorrentes só existem nos diagnósticos novos.
  const comparaDetalhe = r.top3.some((c) => c.fotos !== undefined);

  return (
    <div className="sim-report">
      <div className="sim-report-head">
        <span className="v2-overline site-overline">{RESULTADO.eyebrow}</span>
        <h3 className="sim-report-title">{r.nome}</h3>
        {r.endereco ? <p className="sim-report-addr">{r.endereco}</p> : null}
        {gerado ? <p className="sim-report-addr">Gerado em {gerado}, com dados públicos do Google.</p> : null}
      </div>

      {r.fechado ? (
        <div className="sim-alerta" role="alert">
          <strong>
            {r.fechado === "temporario"
              ? "Atenção: o Google mostra sua empresa como fechada temporariamente."
              : "Atenção: o Google mostra sua empresa como fechada definitivamente."}
          </strong>
          <p>Quem pesquisa vê esse aviso antes de tudo e procura outra empresa. Se você está funcionando, corrija isso no painel do Perfil da Empresa.</p>
        </div>
      ) : null}

      {token ? <GuardarDiagnostico token={token} /> : null}

      <p className="sim-veredito">{r.veredito}</p>

      <div className="sim-metrics">
        <div className="sim-metric">
          <span className="v2-overline sim-metric-label">Posição no Google</span>
          <strong className="sim-metric-value">
            {r.buscaUsada ? r.posicaoRotulo : "Sem comparável"}
          </strong>
          <Badge tone={TONS[r.buscaUsada ? r.posicaoStatus : "melhorar"]}>
            {ROTULOS[r.buscaUsada ? r.posicaoStatus : "melhorar"]}
          </Badge>
          <p className="sim-metric-note">{RESULTADO.posicaoFrase}</p>
        </div>

        <div className="sim-metric">
          <span className="v2-overline sim-metric-label">Reputação</span>
          <strong className="sim-metric-value">
            {notaTexto(r.nota)} ★{" "}
            <span className="sim-metric-sub">({qtdAvaliacoes(r.avaliacoes)})</span>
          </strong>
          <p className="sim-metric-note">
            {r.buscaUsada && faltam > 0
              ? `${faltam === 1 ? "Falta" : "Faltam"} +${qtdAvaliacoes(faltam)} para alcançar a média do Top 3.`
              : r.buscaUsada
                ? "Volume já alcança a média dos 3 primeiros da cidade."
                : "Sem base de comparação na cidade."}
          </p>
          {r.ultimaAvaliacao !== undefined ? (
            <p className="sim-metric-note">
              {r.ultimaAvaliacao
                ? `Avaliação mais recente que o Google mostra: ${haQuanto(diasDesde(r.ultimaAvaliacao, r.geradoEm ? new Date(r.geradoEm) : new Date()))}.`
                : "O Google não mostra nenhuma avaliação recente."}
            </p>
          ) : null}
        </div>

        <div className="sim-metric">
          <span className="v2-overline sim-metric-label">Nota do perfil</span>
          <strong className="sim-metric-value">{r.indice} / 100</strong>
          <span className="sim-score-bar" aria-hidden="true">
            <span style={{ width: `${r.indice}%` }} />
          </span>
          <p className="sim-metric-note">
            Faltam {100 - r.indice} pontos para o perfil ideal.
          </p>
        </div>
      </div>

      {r.acoes && r.acoes.length > 0 ? (
        <div className="sim-bloco sim-hoje">
          <h4 className="sim-bloco-titulo">Faça hoje, de graça</h4>
          <ol className="sim-pesa">
            {r.acoes.map((a, i) => (
              <li className="sim-pesa-item" key={a.titulo}>
                <span className="sim-pesa-n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="sim-pesa-titulo">{a.titulo}</p>
                  <p className="sim-pesa-texto">{a.texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {r.buscaUsada && r.top3.length > 0 ? (
        <div className="sim-bloco">
          <h4 className="sim-bloco-titulo">{RESULTADO.concorrentesTitulo}</h4>
          <div className="site-table-wrap">
            <table className="v2-table sim-table sim-comp">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Negócio</th>
                  <th className="v2-num">Nota</th>
                  <th className="v2-num">Avaliações</th>
                  {comparaDetalhe ? (
                    <>
                      <th className="v2-num">Fotos</th>
                      <th className="v2-num">Site</th>
                      <th className="v2-num">Horário</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {r.top3.map((c) => (
                  <tr key={`${c.posicao}-${c.nome}`} className={c.voce ? "sim-eu" : ""}>
                    <td className="v2-num sim-pos" data-rotulo="Posição">{c.posicao}º</td>
                    <td className="sim-nome">{c.voce ? "Você" : c.nome}</td>
                    <td className="v2-num" data-rotulo="Nota">{notaTexto(c.nota)}</td>
                    <td className="v2-num" data-rotulo="Avaliações">{c.avaliacoes}</td>
                    {comparaDetalhe ? (
                      <>
                        <td className="v2-num" data-rotulo="Fotos">{c.fotos ?? ""}</td>
                        <td className="v2-num" data-rotulo="Site">{marca(c.temSite)}</td>
                        <td className="v2-num" data-rotulo="Horário">{marca(c.temHorarios)}</td>
                      </>
                    ) : null}
                  </tr>
                ))}
                {/* Fora do Top 3, o cliente entra como linha extra; dentro dele, a linha já está marcada. */}
                {r.top3.some((c) => c.voce) ? null : (
                  <tr className="sim-eu">
                    <td className="v2-num sim-pos" data-rotulo="Posição">
                      {r.posicao !== null ? `${r.posicao}º` : "Fora do Top 10"}
                    </td>
                    <td className="sim-nome">Você</td>
                    <td className="v2-num" data-rotulo="Nota">{notaTexto(r.nota)}</td>
                    <td className="v2-num" data-rotulo="Avaliações">{r.avaliacoes}</td>
                    {comparaDetalhe ? (
                      <>
                        <td className="v2-num" data-rotulo="Fotos">{r.fotos}</td>
                        <td className="v2-num" data-rotulo="Site">{marca(r.temSite)}</td>
                        <td className="v2-num" data-rotulo="Horário">{marca(r.temHorarios)}</td>
                      </>
                    ) : null}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {r.buscas && r.buscas.length > 1 ? (
        <div className="sim-bloco">
          <h4 className="sim-bloco-titulo">Sua posição em cada jeito de procurar</h4>
          <div className="site-table-wrap">
            <table className="v2-table sim-table">
              <thead>
                <tr>
                  <th>Como o cliente procura</th>
                  <th>Busca feita no Google</th>
                  <th className="v2-num">Sua posição</th>
                </tr>
              </thead>
              <tbody>
                {r.buscas.map((b) => (
                  <tr key={b.rotulo}>
                    <td className="sim-crit">{b.rotulo}</td>
                    <td className="sim-sub">{b.termo}</td>
                    <td className="v2-num" data-rotulo="Sua posição">
                      <Badge tone={b.posicao !== null && b.posicao <= 3 ? "success" : b.posicao !== null ? "warning" : "danger"}>
                        {b.posicao !== null ? `${b.posicao}º` : "Fora do Top 10"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="sim-metric-note">
            O Google muda a ordem conforme o que a pessoa digita e de onde ela pesquisa. Estar bem em todas é o que traz cliente todo dia.
          </p>
        </div>
      ) : null}

      {r.ia ? (
        <div className="sim-bloco">
          <h4 className="sim-bloco-titulo">O que a IA respondeu</h4>
          <div className="sim-ia">
            <p className="sim-ia-pergunta">
              <span className="v2-overline">Pergunta de cliente</span>
              “{r.ia.pergunta}”
            </p>
            <div className="sim-ia-veredito">
              <Badge tone={r.ia.citado ? "success" : "danger"}>
                {r.ia.citado ? "A IA citou sua empresa" : "A IA não citou sua empresa"}
              </Badge>
              {r.ia.concorrentesCitados.length > 0 ? (
                <p className="sim-metric-note">
                  Dos 3 primeiros do Google, a IA citou: {r.ia.concorrentesCitados.join(", ")}.
                </p>
              ) : null}
            </div>
            <blockquote className="sim-ia-trecho">{r.ia.trecho}</blockquote>
            <p className="sim-metric-note">
              Resposta do {r.ia.ia}, a IA do Google, no momento do diagnóstico
              {r.ia.buscaWeb ? ", consultando a web" : ", com o que ela já sabe"}. O ChatGPT e as outras IAs podem responder diferente,
              mas costumam usar as mesmas fontes: perfil do Google, site e avaliações.
            </p>
          </div>
        </div>
      ) : null}

      {r.siteCheck ? (
        <div className="sim-bloco">
          <h4 className="sim-bloco-titulo">Seu site</h4>
          <div className="site-table-wrap">
            <table className="v2-table sim-table sim-linha">
              <tbody>
                {[
                  { k: "Abre normalmente", v: r.siteCheck.abriu as boolean | null },
                  { k: "Endereço seguro (https)", v: r.siteCheck.https as boolean | null },
                  { k: "Feito para celular", v: r.siteCheck.celular },
                  { k: "Telefone igual ao do Google", v: r.siteCheck.telefone },
                  { k: "Dados que o Google e as IAs leem", v: r.siteCheck.dadosEstruturados },
                ]
                  .filter((l) => l.v !== null)
                  .map((l) => (
                    <tr key={l.k}>
                      <td className="sim-crit">{l.k}</td>
                      <td className="v2-num" data-rotulo="Resultado">
                        <Badge tone={l.v ? "success" : "danger"}>{l.v ? "Sim" : "Não"}</Badge>
                      </td>
                    </tr>
                  ))}
                {r.siteCheck.velocidade !== null ? (
                  <tr>
                    <td className="sim-crit">Velocidade no celular (Google)</td>
                    <td className="v2-num" data-rotulo="Nota">
                      <Badge tone={r.siteCheck.velocidade >= 90 ? "success" : r.siteCheck.velocidade >= 50 ? "warning" : "danger"}>
                        {r.siteCheck.velocidade} / 100
                      </Badge>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="sim-metric-note">Site conferido: {r.siteCheck.url}</p>
        </div>
      ) : null}

      {pesam.length > 0 ? (
        <div className="sim-bloco">
          <h4 className="sim-bloco-titulo">{RESULTADO.pesaTitulo}</h4>
          <ol className="sim-pesa">
            {pesam.map((p, i) => (
              <li className="sim-pesa-item" key={p.titulo}>
                <span className="sim-pesa-n">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="sim-pesa-titulo">{p.titulo}</p>
                  <p className="sim-pesa-texto">{p.texto}</p>
                </div>
                <Badge tone={TONS[p.status]}>{ROTULOS[p.status]}</Badge>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="sim-bloco">
        <h4 className="sim-bloco-titulo">{RESULTADO.criteriosTitulo}</h4>
        <div className="site-table-wrap">
          <table className="v2-table sim-table">
            <thead>
              <tr>
                <th>Critério</th>
                <th>Situação atual no Google</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {r.criterios.map((c) => (
                <tr key={c.criterio}>
                  <td className="sim-crit">{c.criterio}</td>
                  <td className="sim-sub">{c.situacao}</td>
                  <td data-rotulo="Status">
                    <Badge tone={TONS[c.status]}>{ROTULOS[c.status]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button variant="primary" className="sim-cta" href={whatsappLink(r.resumo)}>
        {ctaTexto(r)}
      </Button>
      <a
        className="sim-prefiro"
        href={whatsappLink("Olá! Vim pelo site da V2 Digital.")}
      >
        {RESULTADO.prefiro}
      </a>
      <p className="sim-confianca">{RESULTADO.confianca}</p>
    </div>
  );
}

export function Simulador() {
  const chamar = useServerFn(analisarPerfil);
  const [mapsUrl, setMapsUrl] = useState("");
  const [usarLink, setUsarLink] = useState(false);
  const [empresa, setEmpresa] = useState<Sugestao | null>(null);
  const [empresaErro, setEmpresaErro] = useState("");
  const [sessao, setSessao] = useState(novaSessao);
  const [nome, setNome] = useState("");
  const [nomeErro, setNomeErro] = useState("");
  const [whats, setWhats] = useState("");
  const [whatsErro, setWhatsErro] = useState("");
  const [rodando, setRodando] = useState(false);
  const [etapa, setEtapa] = useState(0);
  const [resultado, setResultado] = useState<SimResultado | null>(null);

  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setEtapa((e) => Math.min(e + 1, ETAPAS.length - 1)), 3000);
    return () => clearInterval(t);
  }, [rodando]);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const empresaOk = usarLink ? mapsUrl.trim().length > 0 : !!empresa;
    const nomeOk = nomeValido(nome);
    const whatsOk = whatsappValido(whats);
    setEmpresaErro(empresaOk ? "" : EMPRESA_INVALIDA);
    setNomeErro(nomeOk ? "" : NOME_INVALIDO);
    setWhatsErro(whatsOk ? "" : WHATSAPP_INVALIDO);
    if (!empresaOk || !nomeOk || !whatsOk) return;
    setResultado(null);
    setRodando(true);
    setEtapa(0);
    try {
      // O servidor grava o contato antes de consultar o Google; se a
      // gravação falhar, a análise nem roda.
      const r = await chamar({
        data: usarLink
          ? { mapsUrl, nomeContato: nome, whatsapp: whats }
          : { placeId: empresa?.placeId ?? "", sessao, businessName: empresa?.nome ?? "", nomeContato: nome, whatsapp: whats },
      });
      // A sessão de sugestões termina na análise; a próxima busca abre outra.
      setSessao(novaSessao());
      if (!r.ok && r.erro === CAPTURA_FALHOU) {
        setWhatsErro(CAPTURA_FALHOU);
      } else {
        setResultado(r);
      }
    } catch {
      setResultado({ ok: false, erro: "A análise não concluiu. Tente de novo em instantes." });
    } finally {
      setRodando(false);
    }
  }

  const progresso = rodando ? ((etapa + 1) / ETAPAS.length) * 92 : resultado ? 100 : 0;

  return (
    <section className="site-section" id="auditoria">
      <div className="site-wrap">
        <div className="site-title">
          <span className="v2-overline site-overline">{AUDITORIA.eyebrow}</span>
          <h2 className="ds-h1">{AUDITORIA.titulo}</h2>
          <p className="ds-lead">{AUDITORIA.apoio}</p>
        </div>

        <form className="sim-form" id="diagnostico-form" onSubmit={enviar}>
          {usarLink ? (
            <div className="sim-busca">
              <Input
                label="Link do Google Maps"
                name="mapsUrl"
                placeholder="https://maps.app.goo.gl/..."
                hint="No Google Maps, toque em Compartilhar e copie o link da sua empresa."
                inputMode="url"
                autoComplete="url"
                error={empresaErro || undefined}
                value={mapsUrl}
                onChange={(e) => { setMapsUrl(e.target.value); if (empresaErro) setEmpresaErro(""); }}
              />
              <button type="button" className="sim-link-btn" onClick={() => { setUsarLink(false); setEmpresaErro(""); }}>
                Prefiro procurar pelo nome
              </button>
            </div>
          ) : (
            <div className="sim-busca">
              <BuscaEmpresa
                escolhida={empresa}
                onEscolher={(s) => {
                  setEmpresa(s);
                  if (s) setEmpresaErro("");
                  else setSessao(novaSessao()); // "Trocar" começa uma busca nova
                }}
                sessao={sessao}
                erro={empresaErro || undefined}
              />
              {!empresa ? (
                <button type="button" className="sim-link-btn" onClick={() => { setUsarLink(true); setEmpresaErro(""); }}>
                  Não achou? Cole o link do Google Maps
                </button>
              ) : null}
            </div>
          )}
          <Input
            label="Seu nome"
            name="nome"
            placeholder="Como você prefere ser chamado"
            autoComplete="given-name"
            required
            error={nomeErro || undefined}
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (nomeErro) setNomeErro("");
            }}
          />
          <Input
            label="Seu WhatsApp"
            name="whats"
            placeholder="(00) 00000-0000"
            hint="Seu contato fica com a V2 para conversar sobre o diagnóstico. Sem compromisso."
            inputMode="tel"
            autoComplete="tel"
            required
            error={whatsErro || undefined}
            value={whats}
            onChange={(e) => {
              setWhats(e.target.value);
              if (whatsErro) setWhatsErro("");
            }}
          />
          <Button variant="secondary" type="submit" disabled={rodando}>
            {rodando ? "Analisando o perfil..." : AUDITORIA.botao}
          </Button>
        </form>

        {rodando ? (
          <div className="sim-loading" aria-live="polite">
            <div className="sim-bar"><span style={{ width: `${progresso}%` }} /></div>
            <p className="sim-stage">{ETAPAS[etapa]}</p>
          </div>
        ) : null}

        {!rodando && resultado && !resultado.ok ? (
          <div className="sim-error" role="alert">
            <strong>Não deu para consultar agora.</strong>
            <p>{resultado.erro}</p>
          </div>
        ) : null}

        {!rodando && resultado && resultado.ok ? (
          <Relatorio r={resultado.relatorio} token={resultado.token} />
        ) : null}
      </div>
    </section>
  );
}
