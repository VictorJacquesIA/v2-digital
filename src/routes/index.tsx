import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell, SectionTitle } from "@/components/v2/shell";
import { Simulador } from "@/components/v2/simulador";
import { LogoStrip } from "@/components/v2/logo-strip";
import { Button, Card } from "@/components/v2/ui";
import { ICONES_COMPLEMENTO, ICONE_OFERTA } from "@/lib/icons";
import { whatsappLink } from "@/lib/contact";
import {
  AUDITORIA,
  COMPLEMENTOS,
  CTA_FINAL,
  FAQ,
  FAQ_TITULO,
  HERO,
  METODO,
  OFERTA,
  PROBLEMA,
  PROVA,
} from "@/lib/content";
import { alternarItem, itensEscolhidos, mensagemProposta } from "@/lib/proposta";

const SITE_URL = "/";
const SITE_TITLE = "Google Meu Negócio e Visibilidade em IA | V2 Digital";
const SITE_DESC =
  "Coloque sua empresa no Top 3 do Google Maps e nas respostas do ChatGPT e das outras IAs. Diagnóstico grátis para a sua empresa.";

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "V2 Digital",
  description: SITE_DESC,
  telephone: "+5554999507960",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Imbituba",
    addressRegion: "SC",
    addressCountry: "BR",
  },
  areaServed: { "@type": "Country", name: "Brasil" },
  url: SITE_URL,
  knowsAbout: [
    "Google Meu Negócio",
    "Visibilidade em IA",
    "Avaliações de clientes",
    "Tráfego pago local",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.pergunta,
    acceptedAnswer: { "@type": "Answer", text: f.resposta },
  })),
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESC },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(localBusiness) },
      { type: "application/ld+json", children: JSON.stringify(faqSchema) },
    ],
  }),
  component: Site,
});

function Site() {
  // Itens que o visitante juntou na proposta (oferta principal e complementos).
  const [proposta, setProposta] = useState<string[]>([]);
  const escolhidos = itensEscolhidos(proposta);
  const alternar = (id: string) => setProposta((atual) => alternarItem(atual, id));

  // A barra da proposta some na seção final, que já mostra o mesmo botão.
  const contatoRef = useRef<HTMLElement>(null);
  const [naContato, setNaContato] = useState(false);
  useEffect(() => {
    const alvo = contatoRef.current;
    if (!alvo || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([e]) => setNaContato(!!e?.isIntersecting), { threshold: 0.2 });
    obs.observe(alvo);
    return () => obs.disconnect();
  }, []);

  // Links internos (#...) rolam uma vez só, direto ao alvo: sem isso a rolagem do
  // navegador e a do roteador se somavam e passavam do ponto no celular.
  useEffect(() => {
    function aoClicar(e: MouseEvent) {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      const id = a?.getAttribute("href")?.slice(1);
      const alvo = id ? document.getElementById(id) : null;
      if (!alvo) return;
      e.preventDefault();
      alvo.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }
    document.addEventListener("click", aoClicar);
    return () => document.removeEventListener("click", aoClicar);
  }, []);

  return (
    <Shell esconderWhats={escolhidos.length > 0}>
      <section className="site-hero">
        <div className="site-wrap">
          <span className="v2-overline site-overline">{HERO.eyebrow}</span>
          <h1 className="site-display">{HERO.titulo}</h1>
          <p className="site-lead">{HERO.subtitulo}</p>
          <div className="site-actions">
            <Button variant="primary" href="#diagnostico-form">
              {HERO.acaoPrincipal}
            </Button>
            <Button
              variant="ghost"
              href={whatsappLink("Olá! Vim pelo site da V2 Digital.")}
            >
              {HERO.acaoSecundaria}
            </Button>
          </div>
          <ul className="site-confianca">
            {HERO.confianca.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <Simulador />

      <section className="site-section" id="problema">
        <div className="site-wrap">
          <SectionTitle n="O problema" title={PROBLEMA.titulo}>
            {PROBLEMA.texto}
          </SectionTitle>
          <div className="v2-card-grid">
            {PROBLEMA.cards.map((c) => (
              <div className="site-problema" key={c.titulo}>
                <h3 className="ds-h4">{c.titulo}</h3>
                <p>{c.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-section-alt" id="metodo">
        <div className="site-wrap">
          <SectionTitle n={METODO.eyebrow} title={METODO.titulo} />
          <ol className="site-passos">
            {METODO.passos.map((p) => (
              <li className="site-passo" key={p.n}>
                <span className="site-step-label">
                  {p.n} / {p.nome}
                </span>
                <p className="site-step-text">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="site-section" id="oferta">
        <div className="site-wrap">
          <article className="site-oferta">
            <div className="site-oferta-head">
              <span className="v2-overline site-overline">
                {OFERTA.eyebrow} · {OFERTA.nome}
              </span>
              <img className="v2-card-icon" src={ICONE_OFERTA} alt="" />
            </div>
            <h2 className="ds-h2 site-oferta-titulo">{OFERTA.titulo}</h2>
            <ul className="site-entregas">
              {OFERTA.entregas.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p className="site-meta">{OFERTA.confianca}</p>
            <Button
              variant={proposta.includes("oferta") ? "secondary" : "primary"}
              type="button"
              aria-pressed={proposta.includes("oferta")}
              onClick={() => alternar("oferta")}
            >
              {proposta.includes("oferta") ? "✓ Na sua proposta · remover" : OFERTA.botao}
            </Button>
          </article>
        </div>
      </section>

      <section className="site-section site-section-alt" id="complementos">
        <div className="site-wrap">
          <SectionTitle n="Complementos" title={COMPLEMENTOS.titulo} />
          <div className="v2-card-grid">
            {COMPLEMENTOS.cards.map((c) => (
              <Card
                key={c.n}
                index={c.n}
                icon={ICONES_COMPLEMENTO[c.n]}
                title={c.nome}
                action={
                  <Button
                    variant={proposta.includes(`complemento-${c.n}`) ? "primary" : "secondary"}
                    type="button"
                    aria-pressed={proposta.includes(`complemento-${c.n}`)}
                    onClick={() => alternar(`complemento-${c.n}`)}
                  >
                    {proposta.includes(`complemento-${c.n}`) ? "✓ Incluído · remover" : COMPLEMENTOS.botao}
                  </Button>
                }
              >
                {c.texto}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section" id="prova">
        <div className="site-wrap">
          <SectionTitle n="Prova" title={PROVA.titulo} />
        </div>
        <LogoStrip />
      </section>

      <section className="site-section site-section-alt" id="faq">
        <div className="site-wrap">
          <SectionTitle n="Dúvidas" title={FAQ_TITULO} />
          <div className="site-faq">
            {FAQ.map((f) => (
              <details className="site-faq-item" key={f.pergunta}>
                <summary>{f.pergunta}</summary>
                <p>{f.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section" id="contato" ref={contatoRef}>
        <div className="site-wrap">
          <SectionTitle n="Próximo passo" title={CTA_FINAL.titulo} />
          <div className="site-caminhos">
            {CTA_FINAL.caminhos.map((c) => (
              <article className="site-caminho" key={c.id}>
                <h3 className="site-caminho-rotulo">{c.rotulo}</h3>
                <p className="site-caminho-texto">{c.texto}</p>
                {c.id === "proposta" && escolhidos.length > 0 ? (
                  <p className="site-caminho-itens">
                    <span className="v2-overline">Sua proposta</span>
                    {escolhidos.map((i) => i.nome).join(" + ")}
                  </p>
                ) : null}
                {c.id === "diagnostico" ? (
                  <Button variant="secondary" href="#diagnostico-form">{c.botao}</Button>
                ) : (
                  <Button
                    variant="primary"
                    href={whatsappLink(escolhidos.length > 0 ? mensagemProposta(proposta) : CTA_FINAL.semItens)}
                  >
                    {c.botao}
                  </Button>
                )}
              </article>
            ))}
          </div>
          <p className="site-form-nota">{CTA_FINAL.abaixo}</p>
        </div>
      </section>

      {escolhidos.length > 0 && !naContato ? (
        <aside className="site-proposta" aria-label="Sua proposta" aria-live="polite">
          <div className="site-proposta-itens">
            <span className="v2-overline">
              Sua proposta · {escolhidos.length} {escolhidos.length === 1 ? "item" : "itens"}
            </span>
            <p>{escolhidos.map((i) => i.nome).join(" + ")}</p>
          </div>
          <div className="site-proposta-acoes">
            <Button variant="primary" href={whatsappLink(mensagemProposta(proposta))}>
              Enviar no WhatsApp
            </Button>
          </div>
        </aside>
      ) : null}
    </Shell>
  );
}
