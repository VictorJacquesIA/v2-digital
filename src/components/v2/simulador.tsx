import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Badge, Button, Input } from "./ui";
import { whatsappLink } from "@/lib/contact";
import { AUDITORIA, RESULTADO } from "@/lib/content";
import { CAPTURA_FALHOU, NOME_INVALIDO, WHATSAPP_INVALIDO, nomeValido, whatsappValido } from "@/lib/lead";
import { analisarPerfil, type SimResultado } from "@/lib/simulador.functions";
import {
  explicacaoCurta,
  type SimReport,
  type SimStatus,
} from "@/lib/simulador-score";

const ETAPAS = [
  "Lendo link do Google Maps...",
  "Buscando nota e avaliações reais...",
  "Comparando com concorrentes da região...",
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
      titulo: "Posição no mapa",
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

function Relatorio({ r }: { r: SimReport }) {
  const pesam = oQuePesa(r);
  const faltam = faltamAvaliacoes(r);

  return (
    <div className="sim-report">
      <div className="sim-report-head">
        <span className="v2-overline site-overline">{RESULTADO.eyebrow}</span>
        <h3 className="sim-report-title">{r.nome}</h3>
        {r.endereco ? <p className="sim-report-addr">{r.endereco}</p> : null}
      </div>

      <p className="sim-veredito">{r.veredito}</p>

      <div className="sim-metrics">
        <div className="sim-metric">
          <span className="v2-overline sim-metric-label">Posição no mapa</span>
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
            <span className="sim-metric-sub">({r.avaliacoes} avaliações)</span>
          </strong>
          <p className="sim-metric-note">
            {r.buscaUsada && faltam > 0
              ? `Faltam +${faltam} avaliações para alcançar a média do Top 3.`
              : r.buscaUsada
                ? "Volume já alcança a média dos 3 primeiros da cidade."
                : "Sem base de comparação na cidade."}
          </p>
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

      {r.buscaUsada && r.top3.length > 0 ? (
        <div className="sim-bloco">
          <h4 className="sim-bloco-titulo">{RESULTADO.concorrentesTitulo}</h4>
          <div className="site-table-wrap">
            <table className="v2-table sim-table">
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Negócio</th>
                  <th className="v2-num">Nota</th>
                  <th className="v2-num">Avaliações</th>
                </tr>
              </thead>
              <tbody>
                {r.top3.map((c) => (
                  <tr key={`${c.posicao}-${c.nome}`} className={c.voce ? "sim-eu" : ""}>
                    <td className="v2-num">{c.posicao}º</td>
                    <td>{c.voce ? "Você" : c.nome}</td>
                    <td className="v2-num">{notaTexto(c.nota)}</td>
                    <td className="v2-num">{c.avaliacoes}</td>
                  </tr>
                ))}
                {/* Fora do Top 3, o cliente entra como linha extra; dentro dele, a linha já está marcada. */}
                {r.top3.some((c) => c.voce) ? null : (
                  <tr className="sim-eu">
                    <td className="v2-num">
                      {r.posicao !== null ? `${r.posicao}º` : "Fora do Top 10"}
                    </td>
                    <td>Você</td>
                    <td className="v2-num">{notaTexto(r.nota)}</td>
                    <td className="v2-num">{r.avaliacoes}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                  <td>{c.situacao}</td>
                  <td>
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
  const [businessName, setBusinessName] = useState("");
  const [nome, setNome] = useState("");
  const [nomeErro, setNomeErro] = useState("");
  const [whats, setWhats] = useState("");
  const [whatsErro, setWhatsErro] = useState("");
  const [rodando, setRodando] = useState(false);
  const [etapa, setEtapa] = useState(0);
  const [resultado, setResultado] = useState<SimResultado | null>(null);

  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setEtapa((e) => Math.min(e + 1, ETAPAS.length - 1)), 1400);
    return () => clearInterval(t);
  }, [rodando]);

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const nomeOk = nomeValido(nome);
    const whatsOk = whatsappValido(whats);
    setNomeErro(nomeOk ? "" : NOME_INVALIDO);
    setWhatsErro(whatsOk ? "" : WHATSAPP_INVALIDO);
    if (!nomeOk || !whatsOk) return;
    setResultado(null);
    setRodando(true);
    setEtapa(0);
    try {
      // O servidor grava o contato antes de consultar o Google; se a
      // gravação falhar, a análise nem roda.
      const r = await chamar({ data: { mapsUrl, businessName, nomeContato: nome, whatsapp: whats } });
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

        <form className="sim-form" onSubmit={enviar}>
          <Input
            label="Link do Google Maps"
            name="mapsUrl"
            placeholder="https://maps.app.goo.gl/..."
            hint="No Google Maps, toque em Compartilhar e copie o link da sua empresa."
            inputMode="url"
            autoComplete="url"
            required
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
          />
          <Input
            label="Nome do negócio ou cidade"
            name="businessName"
            placeholder="Ex: Clínica Central — Imbituba"
            hint="Use se o link for de um lugar genérico ou se quiser confirmar pela cidade."
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
          />
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
          <Relatorio r={resultado.relatorio} />
        ) : null}
      </div>
    </section>
  );
}
