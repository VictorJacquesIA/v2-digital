import type { ReactNode } from "react";
import symbolRed from "@/assets/ds/v2-symbol-red.svg";
import logoWhite from "@/assets/ds/v2-digital-logo-white.svg";
import { Button } from "./ui";
import { whatsappLink } from "@/lib/contact";

const navLinks = [
  { href: "#auditoria", label: "Diagnóstico" },
  { href: "#metodo", label: "Método" },
  { href: "#faq", label: "FAQ" },
] as const;

export function Shell({ children, esconderWhats = false }: { children: ReactNode; esconderWhats?: boolean }) {
  return (
    <div id="topo">
      <header className="v2-header">
        <a href="#topo" className="v2-header-logo" aria-label="V2 Digital">
          <img src={symbolRed} alt="V2 Digital" />
        </a>
        <nav className="v2-header-nav">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="v2-header-link">{l.label}</a>
          ))}
        </nav>
        <Button className="v2-header-cta" variant="secondary" size="sm" href={whatsappLink("Olá! Vim pelo site da V2 Digital.")}>
          Falar no WhatsApp
        </Button>
      </header>
      <main>{children}</main>
      <footer className="v2-footer">
        <img className="v2-footer-logo" src={logoWhite} alt="V2 Digital" />
        <nav className="v2-footer-nav">
          {navLinks.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
          <a href={whatsappLink("Olá! Vim pelo site da V2 Digital.")}>WhatsApp</a>
        </nav>
        <p className="v2-footer-note">Marketing digital para empresas</p>
      </footer>
      {/* Com uma proposta montada, a barra da proposta ocupa o lugar deste botão. */}
      {esconderWhats ? (
        <div className="site-proposta-espaco" aria-hidden="true" />
      ) : (
        <a
          className="site-float-wa"
          href={whatsappLink("Olá! Vim pelo site da V2 Digital.")}
        >
          Falar no WhatsApp
        </a>
      )}
    </div>
  );
}

export function SectionTitle({ n, title, children }: { n: string; title: string; children?: ReactNode }) {
  return (
    <div className="site-title">
      <span className="v2-overline site-overline">{n}</span>
      <h2 className="ds-h1">{title}</h2>
      {children && <p className="ds-lead">{children}</p>}
    </div>
  );
}
