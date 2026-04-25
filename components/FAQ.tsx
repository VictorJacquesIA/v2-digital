"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Quanto tempo demora para criar um site?",
    a: "O prazo varia de acordo com o projeto. Uma landing page costuma ficar pronta em 3 a 5 dias úteis, enquanto sites completos levam entre 7 e 14 dias. Após o briefing, informamos o prazo exato para o seu projeto.",
  },
  {
    q: "Preciso ter domínio para criar o site?",
    a: "Não necessariamente. Podemos orientar e auxiliar na compra e configuração do domínio ideal para o seu negócio, ou trabalhar com um domínio que você já possua. Tudo isso faz parte do nosso processo.",
  },
  {
    q: "O site funciona bem no celular?",
    a: "Sim, todos os sites que desenvolvemos são 100% responsivos. Isso significa que funcionam perfeitamente em smartphones, tablets e desktops, garantindo a melhor experiência para qualquer visitante.",
  },
  {
    q: "Posso pedir alterações após a entrega?",
    a: "Claro. Durante o processo de desenvolvimento, você tem rodadas de revisão para ajustar o que for necessário. Após a entrega, oferecemos suporte por período determinado para garantir que tudo funcione perfeitamente.",
  },
  {
    q: "Vocês fazem manutenção do site?",
    a: "Sim! Realizamos manutenção que inclui atualizações de conteúdo, ajustes de layout, otimizações de performance e suporte contínuo. Entre em contato para saber mais sobre como funciona.",
  },
  {
    q: "O site pode ter botão para WhatsApp?",
    a: "Com certeza. O botão de WhatsApp é um dos elementos que sempre recomendamos incluir, pois facilita muito o contato do cliente. Podemos configurar com mensagem personalizada direcionando para o seu número.",
  },
];

function FAQItem({ faq, idx }: { faq: typeof faqs[0]; idx: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: idx * 0.07 }}
      style={{
        borderRadius: "14px",
        background: "rgba(12,16,40,0.5)",
        border: `1px solid ${open ? "rgba(233,30,140,0.25)" : "rgba(255,255,255,0.06)"}`,
        overflow: "hidden",
        transition: "border-color 0.3s ease",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
          background: "none",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontFamily: "var(--font-space)", fontSize: "0.95rem", fontWeight: 600, lineHeight: 1.4 }}>
          {faq.q}
        </span>
        <span style={{
          width: "28px",
          height: "28px",
          minWidth: "28px",
          borderRadius: "50%",
          background: open ? "linear-gradient(135deg, #E91E8C, #1E90FF)" : "rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: open ? "#fff" : "rgba(255,255,255,0.5)",
          transition: "all 0.3s ease",
        }}>
          {open ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <p style={{
              padding: "0 1.5rem 1.25rem",
              fontSize: "0.9rem",
              color: "var(--text-muted)",
              lineHeight: 1.7,
            }}>
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const WA = "https://wa.me/5500000000000?text=Olá!%20Tenho%20uma%20dúvida%20sobre%20os%20serviços.";

  return (
    <section
      id="faq"
      ref={ref}
      style={{
        padding: "6rem 0",
        background: "linear-gradient(180deg, #080D20 0%, #050816 100%)",
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
          <span className="section-label">Dúvidas frequentes</span>
          <h2 className="section-title" style={{ fontFamily: "var(--font-space)", marginBottom: "1rem" }}>
            Perguntas <span className="gradient-text">frequentes</span>
          </h2>
          <p className="section-subtitle" style={{ margin: "0 auto" }}>
            Tire suas dúvidas sobre o nosso processo, prazos e serviços.
          </p>
        </motion.div>

        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.875rem",
          }}
        >
          {inView && faqs.map((faq, i) => (
            <FAQItem key={i} faq={faq} idx={i} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{ textAlign: "center", marginTop: "2.5rem" }}
        >
          <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Não encontrou o que procurava?
          </p>
          <a href={WA} target="_blank" rel="noopener noreferrer" className="btn-outline">
            Falar com a gente
          </a>
        </motion.div>
      </div>
    </section>
  );
}
