"use client";

import { motion } from "framer-motion";
import WhatsAppIcon from "@/components/WhatsAppIcon";

const WA = "https://wa.me/5548991472902?text=Olá!%20Quero%20criar%20meu%20site%20profissional%20com%20a%20V2%20Digital.";

export default function WhatsAppFloat() {
  return (
    <motion.a
      href={WA}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        position: "fixed",
        bottom: "1.75rem",
        right: "1.75rem",
        zIndex: 200,
        width: "58px",
        height: "58px",
        borderRadius: "50%",
        background: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        textDecoration: "none",
        boxShadow: "0 4px 24px rgba(37,211,102,0.45), 0 0 0 0 rgba(37,211,102,0.4)",
        animation: "wa-pulse 2.5s ease-in-out 3s infinite",
        background: "linear-gradient(135deg, #25D366, #128C7E)",
      }}
    >
      <WhatsAppIcon size={26} />
      <style>{`
        @keyframes wa-pulse {
          0% { box-shadow: 0 8px 32px rgba(37,211,102,0.5), 0 0 0 0 rgba(37,211,102,0.4); }
          70% { box-shadow: 0 8px 32px rgba(37,211,102,0.5), 0 0 0 18px rgba(37,211,102,0); }
          100% { box-shadow: 0 8px 32px rgba(37,211,102,0.5), 0 0 0 0 rgba(37,211,102,0); }
        }
      `}</style>
    </motion.a>
  );
}
