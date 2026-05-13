"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Image from "next/image";

const links = [
  { label: "Serviços", href: "#servicos" },
  { label: "Processo", href: "#processo" },
  // { label: "Portfólio", href: "#portfolio" },
  { label: "FAQ", href: "#faq" },
];

const WA = "https://wa.me/5548991472902?text=Olá!%20Quero%20criar%20meu%20site%20profissional.";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={scrolled ? "navbar-header scrolled" : "navbar-header"}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "all 0.3s ease",
        background: scrolled ? "rgba(5,8,22,0.6)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.04)" : "none",
      }}
    >
      <div className="section-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {/* Logo */}
        <a href="#" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Image src="/logo.png" alt="V2 Digital" width={260} height={87} style={{ objectFit: "contain", objectPosition: "left" }} className="navbar-logo" priority />
        </a>

        {/* Desktop nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="hidden-mobile">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "rgba(255,255,255,0.65)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
            >
              {l.label}
            </a>
          ))}
          <a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ padding: "0.6rem 1.4rem", fontSize: "0.85rem", borderRadius: "10px" }}
          >
            <WhatsAppIcon size={15} />
            WhatsApp
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="show-mobile"
          style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "0.25rem" }}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              overflow: "hidden",
              background: "rgba(5,8,22,0.97)",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="section-wrap" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.75)", textDecoration: "none", fontWeight: 500 }}
                >
                  {l.label}
                </a>
              ))}
              <a
                href={WA}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ marginTop: "0.5rem", justifyContent: "center" }}
              >
                <WhatsAppIcon size={16} />
                Falar no WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile { display: none; }
        .navbar-header { padding: 1.25rem 0; }
        .navbar-header.scrolled { padding: 0.4rem 0; }
        .navbar-logo { width: 260px; height: 87px; }
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
          .navbar-header { padding: 0.25rem 0; }
          .navbar-header.scrolled { padding: 0.25rem 0; }
          .navbar-logo { width: 280px !important; height: 94px !important; }
        }
      `}</style>
    </motion.header>
  );
}
