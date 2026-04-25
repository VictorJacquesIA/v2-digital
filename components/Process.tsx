"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ClipboardList, Lightbulb, Code2, Eye, Globe, HeartHandshake } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: <ClipboardList size={20} />,
    title: "Briefing do negócio",
    desc: "Entendemos o seu negócio, público-alvo, concorrência e objetivos para criar uma estratégia personalizada.",
    color: "#E91E8C",
  },
  {
    num: "02",
    icon: <Lightbulb size={20} />,
    title: "Estratégia da página",
    desc: "Definimos a estrutura, o fluxo de navegação e os elementos que vão guiar o visitante até a conversão.",
    color: "#C851A8",
  },
  {
    num: "03",
    icon: <Code2 size={20} />,
    title: "Desenvolvimento visual",
    desc: "Criamos o design e desenvolvemos a página com código limpo, animações elegantes e identidade marcante.",
    color: "#9060C0",
  },
  {
    num: "04",
    icon: <Eye size={20} />,
    title: "Revisão com o cliente",
    desc: "Apresentamos o projeto e refinamos os detalhes junto com você até o resultado estar exatamente como esperado.",
    color: "#6070D8",
  },
  {
    num: "05",
    icon: <Globe size={20} />,
    title: "Publicação online",
    desc: "Colocamos seu site no ar com domínio, hospedagem e configurações técnicas para máxima performance.",
    color: "#3080EF",
  },
  {
    num: "06",
    icon: <HeartHandshake size={20} />,
    title: "Suporte e melhorias",
    desc: "Acompanhamos os resultados e realizamos ajustes para garantir que sua página continue convertendo.",
    color: "#1E90FF",
  },
];

export default function Process() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="processo"
      ref={ref}
      style={{
        padding: "6rem 0",
        background: "linear-gradient(180deg, #080D20 0%, #050816 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background orb */}
      <div style={{
        position: "absolute",
        right: "-200px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(233,30,140,0.06) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />

      <div className="section-wrap" style={{ position: "relative" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
        >
          <span className="section-label">Processo</span>
          <h2 className="section-title" style={{ fontFamily: "var(--font-space)", marginBottom: "1rem" }}>
            Como <span className="gradient-text">funciona</span>
          </h2>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            Um processo transparente, colaborativo e orientado a resultados. Do briefing ao ar em dias.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.09 }}
              style={{
                padding: "1.75rem",
                borderRadius: "16px",
                background: "rgba(12,16,40,0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
                position: "relative",
              }}
              whileHover={{ borderColor: `${step.color}25`, y: -4 }}
            >
              {/* Step number */}
              <div style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                fontSize: "2.5rem",
                fontWeight: 800,
                fontFamily: "var(--font-space)",
                color: "rgba(255,255,255,0.04)",
                lineHeight: 1,
              }}>
                {step.num}
              </div>

              <div style={{
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                background: `${step.color}18`,
                border: `1px solid ${step.color}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: step.color,
                marginBottom: "1rem",
              }}>
                {step.icon}
              </div>

              <div style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: step.color,
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}>
                Etapa {step.num}
              </div>

              <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.625rem", color: "#fff" }}>
                {step.title}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
