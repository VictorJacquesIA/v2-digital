"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { AlertCircle, TrendingDown, MessageSquareOff, Star, Clock } from "lucide-react";

const problems = [
  {
    icon: <AlertCircle size={22} />,
    title: "Cliente não encontra você no Google",
    desc: "Sem um site, seu negócio simplesmente não aparece quando alguém procura",
    color: "#E91E8C",
  },
  {
    icon: <Star size={22} />,
    title: "Falta de autoridade online",
    desc: "Sem um pagina profissional, sua empresa parece menor do que realmente é.",
    color: "#1E90FF",
  },
  {
    icon: <MessageSquareOff size={22} />,
    title: "Pouca conversão no WhatsApp",
    desc: "Sem uma página que guie o cliente, ele vai embora antes de entrar em contato.",
    color: "#E91E8C",
  },
  {
    icon: <TrendingDown size={22} />,
    title: "Aparência amadora no digital",
    desc: "Um visual ultrapassado ou inexistente afasta clientes mesmo antes de falar com você.",
    color: "#1E90FF",
  },
  {
    icon: <Clock size={22} />,
    title: "Dependência de redes sociais",
    desc: "Você fica refém de algoritmos e alcance limitado.",
    color: "#E91E8C",
  },
];

export default function Problem() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      style={{
        padding: "6rem 0",
        background: "linear-gradient(180deg, #050816 0%, #080D20 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative line */}
      <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "1px", height: "80px", background: "linear-gradient(to bottom, transparent, rgba(233,30,140,0.4))" }} />

      <div className="section-wrap">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
        >
          <span className="section-label">O problema</span>
          <h2 className="section-title" style={{ fontFamily: "var(--font-space)", marginBottom: "1rem" }}>
            Sua empresa não pode depender{" "}
            <span className="gradient-text">apenas do Instagram</span>
          </h2>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            Muitos negócios locais perdem oportunidades todos os dias por não terem uma 
            presença digital estruturada e preparada para conversão.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          {problems.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                padding: "1.75rem",
                borderRadius: "16px",
                background: "rgba(12,16,40,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              whileHover={{
                borderColor: `${p.color}30`,
                boxShadow: `0 0 30px ${p.color}15`,
                y: -4,
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: `${p.color}15`,
                  border: `1px solid ${p.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: p.color,
                  marginBottom: "1rem",
                }}
              >
                {p.icon}
              </div>
              <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.625rem", color: "#fff" }}>
                {p.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                {p.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
