"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Palette, PenTool, Smartphone, TrendingUp, Globe } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";

const solutions = [
  { icon: <Palette size={22} />, title: "Design profissional", desc: "Visual moderno, marcante e alinhado com a identidade da sua marca." },
  { icon: <PenTool size={22} />, title: "Copy estratégica", desc: "Textos pensados para comunicar valor, gerar conexão e estimular a ação." },
  { icon: <Smartphone size={22} />, title: "Site responsivo", desc: "Funciona perfeitamente em celulares, tablets e desktops." },
  { icon: <WhatsAppIcon size={22} />, title: "Botões para WhatsApp", desc: "CTAs estratégicos que conectam o visitante direto ao seu atendimento." },
  { icon: <TrendingUp size={22} />, title: "Estrutura de conversão", desc: "Cada elemento pensado para guiar o visitante até a tomada de decisão." },
  { icon: <Globe size={22} />, title: "Publicação na internet", desc: "Seu site no ar com domínio e hospedagem configurados e prontos." },
];

export default function Solution() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      style={{
        padding: "6rem 0",
        background: "linear-gradient(180deg, #080D20 0%, #050816 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background accent */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px",
        height: "600px",
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
          <span className="section-label" style={{ background: "rgba(30,144,255,0.1)", borderColor: "rgba(30,144,255,0.25)", color: "#60BFFF" }}>
            A solução
          </span>
          <h2 className="section-title" style={{ fontFamily: "var(--font-space)", marginBottom: "1rem" }}>
            A V2 Digital cria sua{" "}
            <span className="gradient-text-blue">presença online</span>{" "}
            com estratégia
          </h2>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            Desenvolvemos sites e landing pages pensados para vender com os olhos,
            transmitir confiança e facilitar a decisão do cliente.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {solutions.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              style={{
                padding: "1.75rem",
                borderRadius: "16px",
                background: "rgba(12,16,40,0.5)",
                border: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
                transition: "all 0.3s ease",
              }}
              whileHover={{
                borderColor: "rgba(30,144,255,0.2)",
                boxShadow: "0 0 30px rgba(30,144,255,0.08)",
                y: -4,
              }}
            >
              <div style={{
                width: "46px",
                height: "46px",
                minWidth: "46px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, rgba(233,30,140,0.15), rgba(30,144,255,0.15))",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#60BFFF",
              }}>
                {s.icon}
              </div>
              <div>
                <h3 style={{ fontFamily: "var(--font-space)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem", color: "#fff" }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>
                  {s.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
