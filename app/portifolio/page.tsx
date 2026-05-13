"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

const WA = "https://wa.me/5548991472902?text=Olá!%20Vi%20o%20portfólio%20da%20V2%20Digital%20e%20quero%20saber%20mais.";

type Lang = "pt" | "en" | "es";

const t = {
  pt: {
    wa: "Falar no WhatsApp",
    whoLabel: "Quem é a V2",
    whoTitle: "Estúdio de criação digital focado em",
    whoHighlight: "resultado real",
    whoDesc1: "Somos uma agência de web design localizada em Imbituba, SC. Desenvolvemos sites e landing pages estratégicas para negócios que precisam de uma presença online que realmente gera contatos.",
    whoDesc2: "Cada projeto é construído com foco em conversão — não apenas na aparência, mas na estrutura que leva o visitante a entrar em contato.",
    approachLabel: "Nossa abordagem",
    approachTitle: "Foco em conversão",
    cards: [
      { icon: "🎯", title: "Estrutura estratégica", desc: "Cada seção da página tem um propósito: guiar o visitante até o contato." },
      { icon: "✍️", title: "Copy personalizada", desc: "Texto escrito para o seu público, com a linguagem certa para converter." },
      { icon: "📱", title: "100% responsivo", desc: "Funciona perfeitamente no celular, onde a maioria dos clientes vai acessar." },
      { icon: "💬", title: "Integração com WhatsApp", desc: "Botões estratégicos que levam o visitante direto para a sua conversa." },
    ],
    projectsLabel: "Projetos",
    projectsTitle: "O que já criamos",
    ctaLabel: "Vamos conversar",
    ctaTitle: "Quer um site assim para o seu negócio?",
    ctaDesc: "Fale com a gente pelo WhatsApp e receba uma proposta para o seu negócio.",
    ctaBtn: "Quero meu site agora",
    projects: [
      { niche: "Confeitaria para Pets", objective: "Objetivo", focus: "Captar pedidos de kits festa para pets" },
      { niche: "Oficina Mecânica", objective: "Foco", focus: "Captação de orçamentos e ligações" },
      { niche: "Academia & Fitness", objective: "Objetivo", focus: "Captação de novos alunos" },
      { niche: "Advocacia", objective: "Foco", focus: "Gerar contato com a advogada via WhatsApp" },
    ],
  },
  en: {
    wa: "Talk on WhatsApp",
    whoLabel: "Who is V2",
    whoTitle: "Digital creation studio focused on",
    whoHighlight: "real results",
    whoDesc1: "We are a web design agency based in Imbituba, SC, Brazil. We develop strategic websites and landing pages for businesses that need an online presence that truly generates leads.",
    whoDesc2: "Each project is built with a conversion focus — not just appearance, but the structure that guides visitors to take action.",
    approachLabel: "Our approach",
    approachTitle: "Conversion focused",
    cards: [
      { icon: "🎯", title: "Strategic structure", desc: "Every section of the page has a purpose: guiding the visitor toward contact." },
      { icon: "✍️", title: "Custom copywriting", desc: "Text written for your audience, with the right language to convert." },
      { icon: "📱", title: "100% responsive", desc: "Works perfectly on mobile, where most clients will access your site." },
      { icon: "💬", title: "WhatsApp integration", desc: "Strategic buttons that take the visitor directly to your conversation." },
    ],
    projectsLabel: "Projects",
    projectsTitle: "What we've built",
    ctaLabel: "Let's talk",
    ctaTitle: "Want a site like this for your business?",
    ctaDesc: "Talk to us on WhatsApp and receive a proposal for your business.",
    ctaBtn: "I want my site now",
    projects: [
      { niche: "Pet Bakery", objective: "Goal", focus: "Capture party kit orders for pets" },
      { niche: "Auto Repair Shop", objective: "Focus", focus: "Capture quotes and phone calls" },
      { niche: "Gym & Fitness", objective: "Goal", focus: "Attract new members" },
      { niche: "Law Firm", objective: "Focus", focus: "Generate contact with the lawyer via WhatsApp" },
    ],
  },
  es: {
    wa: "Hablar en WhatsApp",
    whoLabel: "Quiénes somos",
    whoTitle: "Estudio de creación digital enfocado en",
    whoHighlight: "resultados reales",
    whoDesc1: "Somos una agencia de diseño web ubicada en Imbituba, SC, Brasil. Desarrollamos sitios web y landing pages estratégicas para negocios que necesitan una presencia online que realmente genera contactos.",
    whoDesc2: "Cada proyecto se construye con foco en conversión — no solo en la apariencia, sino en la estructura que lleva al visitante a tomar acción.",
    approachLabel: "Nuestro enfoque",
    approachTitle: "Enfoque en conversión",
    cards: [
      { icon: "🎯", title: "Estructura estratégica", desc: "Cada sección de la página tiene un propósito: guiar al visitante hacia el contacto." },
      { icon: "✍️", title: "Copy personalizado", desc: "Texto escrito para tu público, con el lenguaje adecuado para convertir." },
      { icon: "📱", title: "100% responsivo", desc: "Funciona perfectamente en el móvil, donde la mayoría de los clientes accederá." },
      { icon: "💬", title: "Integración con WhatsApp", desc: "Botones estratégicos que llevan al visitante directamente a tu conversación." },
    ],
    projectsLabel: "Proyectos",
    projectsTitle: "Lo que hemos creado",
    ctaLabel: "Hablemos",
    ctaTitle: "¿Quieres un sitio así para tu negocio?",
    ctaDesc: "Habla con nosotros por WhatsApp y recibe una propuesta para tu negocio.",
    ctaBtn: "Quiero mi sitio ahora",
    projects: [
      { niche: "Repostería para Mascotas", objective: "Objetivo", focus: "Captar pedidos de kits de fiesta para mascotas" },
      { niche: "Taller Mecánico", objective: "Enfoque", focus: "Captación de presupuestos y llamadas" },
      { niche: "Gimnasio & Fitness", objective: "Objetivo", focus: "Captación de nuevos alumnos" },
      { niche: "Abogacía", objective: "Enfoque", focus: "Generar contacto con la abogada vía WhatsApp" },
    ],
  },
};

const projects = [
  { title: "Chef Pet Gourmet", image: "/public_portifolio/site-1.png", accent: "#F5B800" },
  { title: "Alto Giro", image: "/public_portifolio/site-2.png", accent: "#E53935" },
  { title: "RF Fitness", image: "/public_portifolio/site-3.png", accent: "#F5B800" },
  { title: "Caroline Forte Advocacia", image: "/public_portifolio/site-4.png", accent: "#C9A84C" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: "easeOut" },
});

const flags: Record<Lang, string> = { pt: "🇧🇷", en: "🇺🇸", es: "🇪🇸" };

export default function Portfolio() {
  const [lang, setLang] = useState<Lang>("pt");
  const tx = t[lang];

  return (
    <div style={{ background: "#050816", minHeight: "100vh", color: "#fff", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ padding: "1.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          <Image src="/logo.png" alt="V2 Digital" width={150} height={50} style={{ objectFit: "contain" }} />

          {/* Language switcher — flags only */}
          <div style={{ display: "flex", gap: "0.2rem", background: "rgba(255,255,255,0.04)", borderRadius: "100px", padding: "0.2rem" }}>
            {(["pt", "en", "es"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                title={l.toUpperCase()}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.15rem",
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  background: lang === l ? "rgba(233,30,140,0.18)" : "transparent",
                  opacity: lang === l ? 1 : 0.45,
                  transform: lang === l ? "scale(1.1)" : "scale(1)",
                }}
              >
                {flags[l]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Seção 1 — Quem é a V2 */}
      <section style={{ padding: "5rem 0 0", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative", overflow: "hidden" }}>
        <style>{`
          .portifolio-hero-img { display: block; }
          @media (max-width: 768px) { .portifolio-hero-img { display: none; } }
        `}</style>

        <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(233,30,140,0.1) 0%, transparent 65%)", top: "-200px", right: "-100px", pointerEvents: "none" }} />

        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem" }}>
          <motion.div {...fadeUp(0.1)} style={{ maxWidth: "520px", paddingBottom: "4rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E91E8C", marginBottom: "1rem", display: "block" }}>
              {tx.whoLabel}
            </span>
            <h1 style={{ fontFamily: "var(--font-space)", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.025em", marginBottom: "1.5rem" }}>
              {tx.whoTitle}{" "}
              <span style={{ background: "linear-gradient(135deg, #E91E8C, #1E90FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {tx.whoHighlight}
              </span>
            </h1>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: "1rem" }}>{tx.whoDesc1}</p>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.75 }}>{tx.whoDesc2}</p>
          </motion.div>
        </div>

        {/* Imagem decorativa — direita, contida dentro da seção */}
        <motion.div
          className="portifolio-hero-img"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, delay: 0.25, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "42%",
            maxWidth: "500px",
            pointerEvents: "none",
          }}
        >
          <Image
            src="/public_portifolio/inicial.png"
            alt="Preview V2 Digital"
            fill
            style={{ objectFit: "contain", objectPosition: "right bottom" }}
          />
        </motion.div>
      </section>

      {/* Seção 2 — Foco em conversão */}
      <section style={{ padding: "4rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem" }}>
          <motion.div {...fadeUp(0.1)} style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E91E8C", marginBottom: "1rem", display: "block" }}>
              {tx.approachLabel}
            </span>
            <h2 style={{ fontFamily: "var(--font-space)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {tx.approachTitle}
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
            {tx.cards.map((card, i) => (
              <motion.div
                key={i}
                {...fadeUp(0.1 + i * 0.08)}
                style={{ padding: "1.75rem", borderRadius: "16px", background: "rgba(12,16,40,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span style={{ fontSize: "1.75rem", display: "block", marginBottom: "1rem" }}>{card.icon}</span>
                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{card.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Seção 3 — Projetos */}
      <section style={{ padding: "4rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem" }}>
          <motion.div {...fadeUp(0.1)} style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E91E8C", marginBottom: "1rem", display: "block" }}>
              {tx.projectsLabel}
            </span>
            <h2 style={{ fontFamily: "var(--font-space)", fontSize: "clamp(1.5rem, 3vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.02em" }}>
              {tx.projectsTitle}
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {projects.map((p, i) => {
              const proj = tx.projects[i];
              return (
                <motion.div
                  key={i}
                  {...fadeUp(0.1 + i * 0.07)}
                  style={{ borderRadius: "18px", overflow: "hidden", background: "rgba(12,16,40,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
                  whileHover={{ y: -6, borderColor: `${p.accent}40` }}
                >
                  <div style={{ height: "220px", position: "relative", overflow: "hidden", background: "#0a0d1a" }}>
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      style={{ objectFit: "cover", objectPosition: "top", transition: "transform 0.4s ease" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60px", background: "linear-gradient(to top, rgba(12,16,40,0.95), transparent)" }} />
                  </div>
                  <div style={{ padding: "1.5rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: p.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>{proj.niche}</span>
                    <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1.05rem", fontWeight: 600, margin: "0.4rem 0 0.5rem", color: "#fff" }}>{p.title}</h3>
                    <p style={{ fontSize: "0.825rem", color: "rgba(255,255,255,0.45)" }}>
                      <span style={{ color: p.accent, fontWeight: 600 }}>{proj.objective}:</span> {proj.focus}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Seção 4 — CTA */}
      <section style={{ padding: "5rem 0" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 1.5rem", textAlign: "center" }}>
          <motion.div {...fadeUp(0.1)}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#E91E8C", marginBottom: "1rem", display: "block" }}>
              {tx.ctaLabel}
            </span>
            <h2 style={{ fontFamily: "var(--font-space)", fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "1rem" }}>
              {tx.ctaTitle}
            </h2>
            <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.5)", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
              {tx.ctaDesc}
            </p>
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: "1rem", padding: "1rem 2.5rem", borderRadius: "100px" }}
            >
              {tx.ctaBtn}
            </a>
            <p style={{ marginTop: "1.25rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.2)" }}>
              V2 Digital · Imbituba, SC
            </p>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
