"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, MessageCircle } from "lucide-react";

const WA = "https://wa.me/5500000000000?text=Olá!%20Quero%20criar%20meu%20site%20profissional%20com%20a%20V2%20Digital.";

export default function CTAFinal() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      style={{
        padding: "6rem 0",
        background: "#050816",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background orbs */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "800px",
        height: "400px",
        background: "radial-gradient(ellipse, rgba(233,30,140,0.12) 0%, rgba(30,144,255,0.06) 40%, transparent 70%)",
        pointerEvents: "none",
      }} className="animate-glow" />

      {/* Grid */}
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.6 }} />

      <div className="section-wrap" style={{ position: "relative", textAlign: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            padding: "4rem 2rem",
            borderRadius: "24px",
            background: "linear-gradient(160deg, rgba(233,30,140,0.08), rgba(30,144,255,0.06))",
            border: "1px solid rgba(233,30,140,0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top glow border */}
          <div style={{
            position: "absolute",
            top: 0,
            left: "15%",
            right: "15%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, #E91E8C, #1E90FF, transparent)",
          }} />

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="section-label"
            style={{ marginBottom: "1.5rem" }}
          >
            Próximo passo
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.15 }}
            style={{
              fontFamily: "var(--font-space)",
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              marginBottom: "1.25rem",
            }}
          >
            Pronto para ter um site que representa o{" "}
            <span className="gradient-text">nível do seu negócio?</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.22 }}
            style={{
              fontSize: "1.05rem",
              color: "var(--text-muted)",
              lineHeight: 1.7,
              maxWidth: "560px",
              margin: "0 auto 2.5rem",
            }}
          >
            Fale com a V2 Digital e dê o próximo passo para transformar sua presença
            online em uma máquina de oportunidades.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.3 }}
            style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center" }}
          >
            <a
              href={WA}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: "1rem", padding: "1rem 2.5rem" }}
            >
              <MessageCircle size={18} />
              Quero criar meu site
              <ArrowRight size={18} />
            </a>
            <a
              href="#servicos"
              className="btn-outline"
              style={{ fontSize: "1rem", padding: "1rem 2rem" }}
            >
              Ver serviços
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.45 }}
            style={{
              marginTop: "2.5rem",
              paddingTop: "2rem",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "2rem",
            }}
          >
            {[
              "✅ Sem contrato longo",
              "✅ Resposta em até 24h",
              "✅ Resultado garantido",
            ].map((badge, i) => (
              <span key={i} style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                {badge}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
