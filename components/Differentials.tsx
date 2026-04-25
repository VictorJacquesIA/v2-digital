"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Award, Target, Clock, Smartphone, Lightbulb, Users } from "lucide-react";

const items = [
  {
    icon: <Award size={24} />,
    title: "Visual profissional e moderno",
    desc: "Cada projeto tem identidade própria. Nada de templates genéricos — criamos algo único para o seu negócio.",
    color: "#E91E8C",
  },
  {
    icon: <Target size={24} />,
    title: "Foco em conversão",
    desc: "Estrutura, copy e design pensados para um objetivo claro: transformar visitantes em clientes reais.",
    color: "#1E90FF",
  },
  {
    icon: <Clock size={24} />,
    title: "Entrega prática e objetiva",
    desc: "Sem burocracia, sem enrolação. Processo ágil, comunicação clara e prazos cumpridos.",
    color: "#E91E8C",
  },
  {
    icon: <Smartphone size={24} />,
    title: "100% adaptado para celular",
    desc: "Mais de 80% das visitas vêm do celular. Suas páginas funcionam perfeitamente em qualquer tela.",
    color: "#1E90FF",
  },
  {
    icon: <Lightbulb size={24} />,
    title: "Estratégia por nicho",
    desc: "Entendemos as dores e o comportamento do cliente ideal para cada segmento de mercado.",
    color: "#E91E8C",
  },
  {
    icon: <Users size={24} />,
    title: "Atendimento próximo",
    desc: "Você fala diretamente com quem cria o seu projeto. Sem intermediários, sem jogos de telefone.",
    color: "#1E90FF",
  },
];

export default function Differentials() {
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
      {/* Background decoration */}
      <div style={{
        position: "absolute",
        left: "-200px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(30,144,255,0.06) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div className="section-wrap" style={{ position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
        >
          <span className="section-label">Diferenciais</span>
          <h2 className="section-title" style={{ fontFamily: "var(--font-space)", marginBottom: "1rem" }}>
            Por que escolher a{" "}
            <span className="gradient-text">V2 Digital?</span>
          </h2>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            Não criamos apenas sites bonitos — criamos ferramentas de vendas que funcionam.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{
                padding: "1.75rem",
                borderRadius: "16px",
                background: "rgba(12,16,40,0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: "1.25rem",
                alignItems: "flex-start",
                position: "relative",
                overflow: "hidden",
              }}
              whileHover={{
                borderColor: `${item.color}25`,
                boxShadow: `0 4px 30px ${item.color}0D`,
                y: -4,
              }}
            >
              {/* Icon with gradient bg */}
              <div style={{
                width: "52px",
                height: "52px",
                minWidth: "52px",
                borderRadius: "14px",
                background: `${item.color}12`,
                border: `1px solid ${item.color}25`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: item.color,
              }}>
                {item.icon}
              </div>
              <div>
                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "#fff" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.5 }}
          style={{
            marginTop: "3rem",
            padding: "2.5rem",
            borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(233,30,140,0.08), rgba(30,144,255,0.08))",
            border: "1px solid rgba(255,255,255,0.07)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "2rem",
            textAlign: "center",
          }}
        >
          {[
            { value: "100%", label: "Responsivo em todos os dispositivos" },
            { value: "< 7 dias", label: "Tempo médio de entrega" },
            { value: "24h", label: "Resposta máxima no suporte" },
            { value: "∞", label: "Comprometimento com resultados" },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 800,
                fontFamily: "var(--font-space)",
                background: "linear-gradient(135deg, #E91E8C, #1E90FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.1,
                marginBottom: "0.5rem",
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
