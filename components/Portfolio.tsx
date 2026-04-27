"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ExternalLink } from "lucide-react";

const WA = "https://wa.me/5548991472902?text=Olá!%20Vi%20o%20portfólio%20e%20quero%20saber%20mais.";

const projects = [
  {
    title: "Academia FitForce",
    niche: "Academia & Fitness",
    objective: "Objetivo",
    focus: "Captar leads para matrícula",
    gradient: "linear-gradient(135deg, #E91E8C 0%, #FF6B35 100%)",
    icon: "🏋️",
    tags: ["Landing Page", "Fitness"],
    accent: "#E91E8C",
  },
  {
    title: "AutoCenter Silva",
    niche: "Oficina Mecânica",
    objective: "Foco",
    focus: "Agendamentos de serviços",
    gradient: "linear-gradient(135deg, #1E90FF 0%, #00BCD4 100%)",
    icon: "🔧",
    tags: ["Site Institucional", "Automotivo"],
    accent: "#1E90FF",
  },
  {
    title: "Barbearia Kings",
    niche: "Barbearia Premium",
    objective: "Foco",
    focus: "Agendamentos online",
    gradient: "linear-gradient(135deg, #2C3E50 0%, #4a4a6a 100%)",
    icon: "✂️",
    tags: ["Landing Page", "Beleza"],
    accent: "#8B8BC8",
  },
  {
    title: "Estética Renata",
    niche: "Clínica Estética",
    objective: "Estrutura",
    focus: "Para conversão e agendamentos",
    gradient: "linear-gradient(135deg, #C2185B 0%, #9C27B0 100%)",
    icon: "✨",
    tags: ["Site Institucional", "Saúde"],
    accent: "#CE93D8",
  },
  {
    title: "Climatiza Ar",
    niche: "Instalação de Ar-Condicionado",
    objective: "Objetivo",
    focus: "Captar orçamentos via WhatsApp",
    gradient: "linear-gradient(135deg, #00BCD4 0%, #1E90FF 100%)",
    icon: "❄️",
    tags: ["Landing Page", "Serviços"],
    accent: "#00BCD4",
  },
  {
    title: "Studio Lívia",
    niche: "Studio de Beleza",
    objective: "Estrutura",
    focus: "Para conversão",
    gradient: "linear-gradient(135deg, #E91E8C 0%, #9C27B0 100%)",
    icon: "💅",
    tags: ["Landing Page", "Beleza"],
    accent: "#E91E8C",
  },
];

export default function Portfolio() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="portfolio"
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
          <span className="section-label">Portfólio</span>
          <h2 className="section-title" style={{ fontFamily: "var(--font-space)", marginBottom: "1rem" }}>
            Projetos criados para{" "}
            <span className="gradient-text">vender com mais impacto</span>
          </h2>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            Cada projeto é desenvolvido com estratégia, identidade própria e foco total em resultados.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {projects.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.09 }}
              style={{
                borderRadius: "18px",
                overflow: "hidden",
                background: "rgba(12,16,40,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                cursor: "pointer",
              }}
              whileHover={{ y: -6, borderColor: `${p.accent}30` }}
            >
              {/* Preview thumbnail */}
              <div style={{
                height: "190px",
                background: p.gradient,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}>
                {/* Browser mockup overlay */}
                <div style={{
                  position: "absolute",
                  inset: "10px",
                  background: "rgba(5,8,22,0.6)",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "8px",
                  backdropFilter: "blur(4px)",
                }}>
                  <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
                    {["#E91E8C", "#FFB800", "#00CC66"].map((c, j) => (
                      <span key={j} style={{ width: "8px", height: "8px", borderRadius: "50%", background: c, display: "block", opacity: 0.7 }} />
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <div style={{ width: "50%", height: "8px", background: "rgba(255,255,255,0.25)", borderRadius: "4px" }} />
                    <div style={{ width: "70%", height: "5px", background: "rgba(255,255,255,0.12)", borderRadius: "3px" }} />
                    <div style={{ width: "60%", height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px" }} />
                  </div>
                </div>
                {/* Niche icon */}
                <span style={{ fontSize: "3rem", position: "relative", zIndex: 2, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))", marginTop: "20px" }}>
                  {p.icon}
                </span>
              </div>

              {/* Card content */}
              <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
                  {p.tags.map((t, j) => (
                    <span key={j} style={{
                      padding: "0.2rem 0.625rem",
                      borderRadius: "100px",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      background: `${p.accent}15`,
                      border: `1px solid ${p.accent}25`,
                      color: p.accent,
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.5rem", color: "#fff" }}>
                  {p.title}
                </h3>
                <div style={{ marginBottom: "1.25rem" }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: p.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {p.objective}:
                  </span>{" "}
                  <span style={{ fontSize: "0.825rem", color: "var(--text-muted)" }}>
                    {p.focus}
                  </span>
                </div>
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
                    color: p.accent,
                    textDecoration: "none",
                  }}
                >
                  Quero algo assim <ExternalLink size={13} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
