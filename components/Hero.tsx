"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Smartphone, Target } from "lucide-react";

const WA = "https://wa.me/5500000000000?text=Olá!%20Quero%20criar%20meu%20site%20profissional.";

const pills = [
  { icon: <Zap size={13} />, text: "Alta Performance" },
  { icon: <Smartphone size={13} />, text: "100% Responsivo" },
  { icon: <Target size={13} />, text: "Foco em Conversão" },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" },
});

export default function Hero() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background: "linear-gradient(160deg, #050816 0%, #0A0D20 55%, #050816 100%)",
      }}
    >
      {/* Background grid */}
      <div
        className="grid-bg"
        style={{ position: "absolute", inset: 0, opacity: 1 }}
      />

      {/* Orbs */}
      <div
        className="animate-glow"
        style={{
          position: "absolute",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(233,30,140,0.12) 0%, transparent 65%)",
          top: "-200px",
          right: "-150px",
          pointerEvents: "none",
        }}
      />
      <div
        className="animate-glow"
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(30,144,255,0.1) 0%, transparent 65%)",
          bottom: "-100px",
          left: "-80px",
          animationDelay: "1.5s",
          pointerEvents: "none",
        }}
      />

      <div className="section-wrap" style={{ position: "relative", zIndex: 2, width: "100%", paddingTop: "10rem", paddingBottom: "4rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center" }} className="hero-grid">
          {/* Left */}
          <div>
            <motion.h1
              {...fadeUp(0.1)}
              style={{
                fontFamily: "var(--font-space)",
                fontSize: "clamp(2rem, 5vw, 3.4rem)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.025em",
                marginBottom: "1.25rem",
              }}
            >
              Sites e Landing Pages que{" "}
              <span className="gradient-text">transformam visitantes</span>{" "}
              em clientes
            </motion.h1>

            <motion.p {...fadeUp(0.2)} className="section-subtitle" style={{ marginBottom: "1.75rem" }}>
              A V2 Digital cria páginas modernas, estratégicas e responsivas para
              empresas que querem vender mais, gerar autoridade e crescer no digital.
            </motion.p>

            <motion.div {...fadeUp(0.3)} style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", marginBottom: "2rem" }}>
              {pills.map((p, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    padding: "0.375rem 0.875rem",
                    borderRadius: "100px",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  <span style={{ color: "var(--pink)" }}>{p.icon}</span>
                  {p.text}
                </span>
              ))}
            </motion.div>

            <motion.div {...fadeUp(0.4)} style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-primary">
                Quero meu site profissional
                <ArrowRight size={17} />
              </a>
              <a href="#servicos" className="btn-outline">
                Ver serviços
              </a>
            </motion.div>
          </div>

          {/* Right — mockups */}
          <div style={{ position: "relative", height: "500px" }} className="hero-visual">
            {/* Main browser */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="animate-float"
              style={{
                position: "absolute",
                top: "0",
                right: "0",
                width: "88%",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.09)",
                boxShadow: "0 30px 80px rgba(0,0,0,0.55), 0 0 50px rgba(30,144,255,0.08)",
              }}
            >
              {/* Browser bar */}
              <div style={{ background: "#0C1028", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  {["#E91E8C", "#FFB800", "#00CC66"].map((c, i) => (
                    <span key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c, display: "block" }} />
                  ))}
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "6px", padding: "4px 12px", fontSize: "11px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.02em" }}>
                  seusite.com.br
                </div>
              </div>
              {/* Content preview */}
              <div style={{ background: "#070B1E", padding: "22px 18px", minHeight: "230px" }}>
                <div style={{ width: "55%", height: "13px", background: "linear-gradient(90deg, #E91E8C, #1E90FF)", borderRadius: "6px", marginBottom: "14px" }} />
                <div style={{ width: "78%", height: "8px", background: "rgba(255,255,255,0.07)", borderRadius: "4px", marginBottom: "8px" }} />
                <div style={{ width: "64%", height: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "4px", marginBottom: "22px" }} />
                <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
                  <div style={{ width: "130px", height: "38px", background: "linear-gradient(135deg, #E91E8C, #1E90FF)", borderRadius: "8px" }} />
                  <div style={{ width: "100px", height: "38px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {[
                    "rgba(233,30,140,0.13)",
                    "rgba(30,144,255,0.13)",
                    "rgba(255,255,255,0.04)",
                  ].map((bg, i) => (
                    <div key={i} style={{ height: "70px", background: bg, border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }} />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Mobile mockup */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: 60 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="animate-float-delay"
              style={{
                position: "absolute",
                bottom: "10px",
                left: "0",
                width: "40%",
                borderRadius: "20px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 25px 60px rgba(0,0,0,0.6), 0 0 30px rgba(233,30,140,0.1)",
              }}
            >
              <div style={{ background: "#0C1028", padding: "10px", display: "flex", justifyContent: "center", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ width: "40px", height: "4px", background: "rgba(255,255,255,0.15)", borderRadius: "2px" }} />
              </div>
              <div style={{ background: "#070B1E", padding: "14px 12px" }}>
                <div style={{ height: "110px", background: "linear-gradient(135deg, rgba(233,30,140,0.18), rgba(30,144,255,0.18))", borderRadius: "10px", marginBottom: "10px" }} />
                <div style={{ width: "80%", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", marginBottom: "6px" }} />
                <div style={{ width: "60%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", marginBottom: "14px" }} />
                <div style={{ height: "32px", background: "linear-gradient(135deg, #E91E8C, #1E90FF)", borderRadius: "7px" }} />
              </div>
            </motion.div>

            {/* Floating stat */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              style={{
                position: "absolute",
                top: "32%",
                left: "-4%",
                padding: "14px 18px",
                borderRadius: "14px",
                background: "rgba(10,14,36,0.92)",
                border: "1px solid rgba(233,30,140,0.25)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(233,30,140,0.1)",
              }}
            >
              <div style={{ fontSize: "1.6rem", fontWeight: 700, fontFamily: "var(--font-space)", background: "linear-gradient(135deg, #E91E8C, #1E90FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>
                +150%
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>em conversões</div>
            </motion.div>

            {/* Floating notification */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              style={{
                position: "absolute",
                top: "4%",
                right: "-2%",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                borderRadius: "14px",
                background: "rgba(10,14,36,0.92)",
                border: "1px solid rgba(30,144,255,0.25)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(30,144,255,0.1)",
              }}
            >
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, #00CC66, #009944)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>
                ✓
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff" }}>Novo lead recebido!</div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)" }}>via seu site profissional</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>scroll</span>
        <div style={{ width: "1px", height: "36px", background: "linear-gradient(to bottom, rgba(233,30,140,0.5), transparent)" }} />
      </motion.div>

      <style>{`
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-visual { display: none !important; }
        }
      `}</style>
    </section>
  );
}
