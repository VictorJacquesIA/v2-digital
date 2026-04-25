"use client";

import { MessageCircle, Mail, ArrowUp, ExternalLink } from "lucide-react";
import Image from "next/image";

const IgIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const WA = "https://wa.me/5500000000000?text=Olá!%20Quero%20criar%20meu%20site%20profissional.";
const IG = "https://instagram.com/v2digital";
const EMAIL = "mailto:contato@v2digital.com.br";

const navLinks = [
  { label: "Serviços", href: "#servicos" },
  { label: "Processo", href: "#processo" },
  { label: "Portfólio", href: "#portfolio" },
  { label: "FAQ", href: "#faq" },
];

const services = [
  "Landing Pages",
  "Sites Institucionais",
  "Páginas para Campanhas",
  "Sites para Negócios Locais",
  "Reformulação Visual",
  "Manutenção Mensal",
];

export default function Footer() {
  return (
    <footer style={{
      background: "#030610",
      borderTop: "1px solid rgba(255,255,255,0.05)",
      paddingTop: "4rem",
    }}>
      <div className="section-wrap">
        {/* Main footer grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
          gap: "3rem",
          paddingBottom: "3rem",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }} className="footer-grid">
          {/* Brand column */}
          <div>
            <a href="#" style={{ textDecoration: "none", display: "inline-block", marginBottom: "1.25rem" }}>
              <Image src="/logo.png" alt="V2 Digital" width={120} height={40} style={{ objectFit: "contain" }} />
            </a>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: "280px", marginBottom: "1.75rem" }}>
              Criamos sites e landing pages profissionais para empresas que querem vender mais e crescer no digital.
            </p>
            {/* Social */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {[
                { href: WA, icon: <MessageCircle size={18} />, label: "WhatsApp", color: "#25D366" },
                { href: IG, icon: <IgIcon />, label: "Instagram", color: "#E91E8C" },
                { href: EMAIL, icon: <Mail size={18} />, label: "E-mail", color: "#1E90FF" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(255,255,255,0.5)",
                    textDecoration: "none",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = s.color;
                    e.currentTarget.style.borderColor = `${s.color}40`;
                    e.currentTarget.style.background = `${s.color}12`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 style={{ fontFamily: "var(--font-space)", fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: "1.25rem", letterSpacing: "0.04em" }}>
              Navegação
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "none", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 style={{ fontFamily: "var(--font-space)", fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: "1.25rem", letterSpacing: "0.04em" }}>
              Serviços
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {services.map((s) => (
                <li key={s}>
                  <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontFamily: "var(--font-space)", fontSize: "0.875rem", fontWeight: 600, color: "#fff", marginBottom: "1.25rem", letterSpacing: "0.04em" }}>
              Contato
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <a
                href={WA}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1.25rem",
                  borderRadius: "12px",
                  background: "rgba(37,211,102,0.08)",
                  border: "1px solid rgba(37,211,102,0.2)",
                  color: "#25D366",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(37,211,102,0.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(37,211,102,0.08)")}
              >
                <MessageCircle size={18} />
                WhatsApp
              </a>
              <a
                href={IG}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1.25rem",
                  borderRadius: "12px",
                  background: "rgba(233,30,140,0.08)",
                  border: "1px solid rgba(233,30,140,0.2)",
                  color: "var(--pink-light)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(233,30,140,0.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(233,30,140,0.08)")}
              >
                <IgIcon />
                @v2digital
              </a>
              <a
                href={EMAIL}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.875rem 1.25rem",
                  borderRadius: "12px",
                  background: "rgba(30,144,255,0.08)",
                  border: "1px solid rgba(30,144,255,0.2)",
                  color: "var(--blue-light)",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,144,255,0.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(30,144,255,0.08)")}
              >
                <Mail size={18} />
                contato@v2digital.com.br
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1.5rem 0",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.3)" }}>
            © {new Date().getFullYear()} V2 Digital. Todos os direitos reservados.
          </p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Voltar ao topo"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(233,30,140,0.15)";
              e.currentTarget.style.color = "var(--pink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            }}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
