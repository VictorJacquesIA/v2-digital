import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Shell, SectionTitle } from "@/components/v2/shell";
import { Simulador } from "@/components/v2/simulador";
import { LogoStrip } from "@/components/v2/logo-strip";
import { Button, Card, Input } from "@/components/v2/ui";
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
import { contatoErros, contatoMensagem, type Erros } from "@/lib/contact-form";

const SITE_URL = "/";
const SITE_TITLE = "Google Meu Negócio e Visibilidade em IA em Imbituba | V2 Digital";
const SITE_DESC =
  "Coloque sua empresa no Top 3 do Google Maps e nas respostas do ChatGPT e do Gemini. Diagnóstico grátis para negócios de Imbituba e região.";

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
  areaServed: ["Imbituba", "Região de Imbituba"],
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
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [maps, setMaps] = useState("");
  const [erros, setErros] = useState<Erros>({});

  function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const contato = { nome, responsavel, telefone, maps };
    const novos = contatoErros(contato);
    setErros(novos);
    if (novos.nome || novos.responsavel || novos.telefone || novos.maps) return;
    window.location.assign(whatsappLink(contatoMensagem(contato)));
  }

  return (
    <Shell>
      <section className="site-hero">
        <div className="site-wrap">
          <span className="v2-overline site-overline">{HERO.eyebrow}</span>
          <h1 className="site-display">{HERO.titulo}</h1>
          <p className="site-lead">{HERO.subtitulo}</p>
          <div className="site-actions">
            <Button variant="primary" href="#auditoria">
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
              variant="primary"
              href={whatsappLink(
                `Olá! Vim pelo site da V2 Digital.\nQuero minha proposta para o ${OFERTA.nome}.`,
              )}
            >
              {OFERTA.botao}
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
                    variant="secondary"
                    href={whatsappLink(
                      `Olá! Vim pelo site da V2 Digital.\nQuero incluir: ${c.nome}.`,
                    )}
                  >
                    {COMPLEMENTOS.botao}
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

      <section className="site-section" id="contato">
        <div className="site-wrap">
          <div className="site-contact">
            <div>
              <span className="v2-overline site-overline">Próximo passo</span>
              <h2 className="ds-h2">{CTA_FINAL.titulo}</h2>
              <p className="ds-lead">{CTA_FINAL.apoio}</p>
            </div>
            <form className="site-form-box" onSubmit={send}>
              <Input
                label="Nome do negócio"
                name="nome"
                placeholder="Padaria Central"
                hint="Como sua empresa é conhecida na cidade."
                error={erros.nome}
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  if (erros.nome) setErros((p) => ({ ...p, nome: undefined }));
                }}
              />
              <Input
                label="Nome do responsável"
                name="responsavel"
                placeholder="Maria Silva"
                hint="Com quem a gente fala no WhatsApp."
                autoComplete="name"
                error={erros.responsavel}
                value={responsavel}
                onChange={(e) => {
                  setResponsavel(e.target.value);
                  if (erros.responsavel) setErros((p) => ({ ...p, responsavel: undefined }));
                }}
              />
              <Input
                label="WhatsApp"
                name="telefone"
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
                error={erros.telefone}
                value={telefone}
                onChange={(e) => {
                  setTelefone(e.target.value);
                  if (erros.telefone) setErros((p) => ({ ...p, telefone: undefined }));
                }}
              />
              <Input
                label="Link do Google Maps ou cidade"
                name="maps"
                placeholder="https://maps.app.goo.gl/... ou Imbituba"
                hint="No Google Maps, toque em Compartilhar e copie o link da sua empresa."
                inputMode="url"
                autoComplete="url"
                error={erros.maps}
                value={maps}
                onChange={(e) => {
                  setMaps(e.target.value);
                  if (erros.maps) setErros((p) => ({ ...p, maps: undefined }));
                }}
              />
              <Button variant="primary" type="submit" className="site-form-submit">
                {CTA_FINAL.botao}
              </Button>
              <p className="site-form-nota">{CTA_FINAL.abaixo}</p>
            </form>
          </div>
        </div>
      </section>
    </Shell>
  );
}
