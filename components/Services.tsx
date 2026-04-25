"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Rocket, Building2, Megaphone, MapPin, RefreshCw, Wrench, ArrowRight } from "lucide-react";

const WA = "https://wa.me/5500000000000?text=Olá!%20Tenho%20interesse%20em%20um%20serviço.";

const services = [
  {
    icon: <Rocket size={26} />,
    title: "Landing Pages de Alta Conversão",
    desc: "Páginas focadas em um único objetivo: transformar visitantes em leads ou clientes. Estrutura, copy e design alinhados para maximizar resultados.",
    gradient: "linear-gradient(135deg, #E91E8C, #C2185B)",
    tag: "Mais popular",
  },
  {
    icon: <Building2 size={26} />,
    title: "Sites Institucionais",
    desc: "Presença completa para sua empresa na internet. Apresenta seus serviços, sua história e sua equipe com profissionalismo e credibilidade.",
    gradient: "linear-gradient(135deg, #1E90FF, #0D47A1)",
    tag: null,
  },
  {
    icon: <Megaphone size={26} />,
    title: "Páginas para Campanhas",
    desc: "Páginas criadas para acompanhar anúncios no Google ou Instagram. Aumentam a taxa de conversão das suas campanhas pagas.",
    gradient: "linear-gradient(135deg, #9C27B0, #6A1B9A)",
    tag: null,
  },
  {
    icon: <MapPin size={26} />,
    title: "Sites para Negócios Locais",
    desc: "Presença digital focada para quem atende uma região específica. Atraia clientes próximos e se destaque na sua cidade.",
    gradient: "linear-gradient(135deg, #00BCD4, #006064)",
    tag: null,
  },
  {
    icon: <RefreshCw size={26} />,
    title: "Reformulação Visual",
    desc: "Modernizamos sites existentes com novo design, nova copy e nova estrutura. Sua empresa atualizada sem começar do zero.",
    gradient: "linear-gradient(135deg, #FF9800, #E65100)",
    tag: null,
  },
  {
    icon: <Wrench size={26} />,
    title: "Manutenção e Suporte Mensal",
    desc: "Alterações, atualizações e melhorias contínuas para manter seu site sempre funcionando e convertendo ao máximo.",
    gradient: "linear-gradient(135deg, #4CAF50, #1B5E20)",
    tag: null,
  },
];

export default function Services() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="servicos"
      ref={ref}
      style={{
        padding: "6rem 0",
        background: "linear-gradient(180deg, #050816 0%, #080D20 100%)",
        position: "relative",
      }}
    >
      <div className="section-wrap">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
        >
          <span className="section-label">Serviços</span>
          <h2 className="section-title" style={{ fontFamily: "var(--font-space)", marginBottom: "1rem" }}>
            O que <span className="gradient-text">criamos</span>
          </h2>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            Soluções digitais completas para cada etapa do crescimento do seu negócio.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {services.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                padding: "2rem",
                borderRadius: "18px",
                background: "rgba(12,16,40,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                position: "relative",
                overflow: "hidden",
              }}
              whileHover={{ y: -6, borderColor: "rgba(255,255,255,0.12)" }}
            >
              {/* Top glow line */}
              <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: s.gradient, opacity: 0.5 }} />

              {s.tag && (
                <span style={{
                  position: "absolute",
                  top: "1.25rem",
                  right: "1.25rem",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "100px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  background: "rgba(233,30,140,0.15)",
                  border: "1px solid rgba(233,30,140,0.3)",
                  color: "var(--pink-light)",
                }}>
                  {s.tag}
                </span>
              )}

              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: s.gradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                marginBottom: "1.25rem",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              }}>
                {s.icon}
              </div>

              <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.75rem", color: "#fff" }}>
                {s.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                {s.desc}
              </p>

              <a
                href={WA}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  color: "var(--pink-light)",
                  textDecoration: "none",
                  transition: "gap 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.gap = "0.7rem")}
                onMouseLeave={(e) => (e.currentTarget.style.gap = "0.4rem")}
              >
                Solicitar orçamento <ArrowRight size={14} />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
