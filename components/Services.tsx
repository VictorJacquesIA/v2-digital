"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Rocket, Check, ArrowRight } from "lucide-react";

const WA = "https://wa.me/5548991472902?text=Olá!%20Tenho%20interesse%20em%20um%20serviço.";

const includes = [
  "Estrutura estratégica de conversão",
  "Copy personalizada para o seu negócio",
  "Design moderno e profissional",
  "Integração com WhatsApp",
  "SEO local",
  "Publicação pronta para receber clientes",
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
          <span className="section-label">Serviço</span>
          <h2 className="section-title" style={{ fontFamily: "var(--font-space)", marginBottom: "1rem" }}>
            Site de Alta Conversão para{" "}
            <span className="gradient-text">Negócios Locais</span>
          </h2>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            Uma página completa, focada em um único objetivo: transformar visitantes em contatos qualificados.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55, delay: 0.15 }}
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            padding: "2.5rem",
            borderRadius: "20px",
            background: "rgba(12,16,40,0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top glow line */}
          <div style={{
            position: "absolute",
            top: 0,
            left: "8%",
            right: "8%",
            height: "1px",
            background: "linear-gradient(135deg, #E91E8C, #C2185B)",
            opacity: 0.6,
          }} />

          {/* Tag */}
          <span style={{
            position: "absolute",
            top: "1.5rem",
            right: "1.5rem",
            padding: "0.25rem 0.75rem",
            borderRadius: "100px",
            fontSize: "0.7rem",
            fontWeight: 600,
            background: "rgba(233,30,140,0.15)",
            border: "1px solid rgba(233,30,140,0.3)",
            color: "var(--pink-light)",
          }}>
            Mais popular
          </span>

          {/* Icon */}
          <div style={{
            width: "54px",
            height: "54px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #E91E8C, #C2185B)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            marginBottom: "1.5rem",
            boxShadow: "0 8px 24px rgba(233,30,140,0.25)",
          }}>
            <Rocket size={24} />
          </div>

          {/* Includes list */}
          <p style={{ fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--pink-light)", marginBottom: "1rem" }}>
            O que está incluso
          </p>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 2rem 0", display: "grid", gap: "0.65rem" }}>
            {includes.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: "0.65rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
                <span style={{
                  flexShrink: 0,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "rgba(233,30,140,0.15)",
                  border: "1px solid rgba(233,30,140,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Check size={11} color="var(--pink-light)" />
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* Notice */}
          <p style={{
            fontSize: "0.8rem",
            color: "rgba(255,255,255,0.35)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "1.25rem",
            marginBottom: "1.75rem",
            lineHeight: 1.6,
          }}>
            O site é preparado para gerar contatos — os resultados dependem da quantidade de visitantes que chegam até ele.
          </p>

          {/* CTA */}
          <a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "100px",
              background: "linear-gradient(135deg, #E91E8C, #C2185B)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.875rem",
              textDecoration: "none",
              transition: "opacity 0.2s, gap 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.85";
              e.currentTarget.style.gap = "0.75rem";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
              e.currentTarget.style.gap = "0.5rem";
            }}
          >
            Solicitar orçamento <ArrowRight size={15} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
