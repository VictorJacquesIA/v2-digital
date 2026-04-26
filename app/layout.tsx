import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "V2 Digital | Sites e Landing Pages Profissionais",
  description:
    "A V2 Digital cria sites e landing pages modernos, estratégicos e responsivos para empresas que querem vender mais, gerar autoridade e crescer no digital.",
  keywords:
    "criação de sites, landing pages, agência digital, sites profissionais, marketing digital, presença online",
  openGraph: {
    title: "V2 Digital | Sites que Transformam Visitantes em Clientes",
    description:
      "Transformamos sua presença online em uma máquina de oportunidades.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${inter.variable}`}
    >
      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
