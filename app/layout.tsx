import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const META_PIXEL_ID = "SEU_PIXEL_ID_AQUI";
const GA_ID = "G-368W2HBNHN";

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

const BASE_URL = "https://v2digital.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "V2 Digital | Web Design em Imbituba, Garopaba e Laguna — SC",
  description:
    "Agência de web design em Imbituba, SC. Criamos sites e landing pages de alta conversão para negócios em Garopaba, Laguna, Florianópolis e toda Santa Catarina. Transforme visitas em contatos reais no WhatsApp.",
  keywords:
    "agência de web design Imbituba, web design Garopaba, web design Laguna, estúdio de criação digital SC, desenvolvimento de sites Imbituba, desenvolvimento de sites Garopaba, criação de landing page Santa Catarina, agência digital Imbituba, agência digital Garopaba, agência digital SC, criação de sites SC, landing page Imbituba, web design Santa Catarina, desenvolvimento web SC, site para negócio local SC, site profissional Imbituba",
  authors: [{ name: "V2 Digital" }],
  creator: "V2 Digital",
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "b2-0BAD-BKLrN9d7GlCsB23GuRk9yw4cOtptv7sOTyw",
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "V2 Digital | Agência de Web Design em Imbituba e Garopaba — SC",
    description:
      "Estúdio de criação digital em Imbituba, SC. Desenvolvimento de sites e landing pages para negócios em Imbituba, Garopaba, Laguna e toda Santa Catarina.",
    type: "website",
    url: BASE_URL,
    siteName: "V2 Digital",
    locale: "pt_BR",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "V2 Digital" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "V2 Digital | Sites que Transformam Visitantes em Clientes",
    description:
      "Criamos páginas estratégicas para negócios locais em todo o Brasil. Foco em conversão e contatos reais no WhatsApp.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Schema.org LocalBusiness */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "V2 Digital",
              description: "Criamos sites e landing pages estratégicas para negócios em todo o Brasil, focados em converter visitantes em contatos reais no WhatsApp.",
              url: "https://v2digital.com.br",
              telephone: "+5548991472902",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Imbituba",
                addressRegion: "SC",
                addressCountry: "BR",
              },
              areaServed: [
                { "@type": "City", name: "Imbituba", containedIn: "Santa Catarina" },
                { "@type": "City", name: "Garopaba", containedIn: "Santa Catarina" },
                { "@type": "City", name: "Laguna", containedIn: "Santa Catarina" },
                { "@type": "City", name: "Florianópolis", containedIn: "Santa Catarina" },
                { "@type": "State", name: "Santa Catarina" },
                { "@type": "Country", name: "Brasil" },
              ],
              serviceType: [
                "Agência de Web Design",
                "Estúdio de Criação Digital",
                "Desenvolvimento de Sites",
                "Desenvolvimento de Landing Pages",
                "Sites de Alta Conversão",
                "Criação de Sites",
              ],
              sameAs: [
                "https://www.instagram.com/v2digital.site/",
              ],
            }),
          }}
        />

        {/* FAQ Schema.org */}
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Quanto custa criar um site profissional?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Na V2 Digital os valores variam conforme o tipo de projeto. Trabalhamos com sites e landing pages de alta conversão sob medida para cada negócio. Entre em contato pelo WhatsApp para receber uma proposta personalizada.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Vocês atendem empresas em Garopaba, Laguna e região?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sim! Atendemos negócios em Imbituba, Garopaba, Laguna, Florianópolis e em todo o Brasil de forma remota.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Quanto tempo leva para o site ficar pronto?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "O prazo médio é de 7 a 14 dias úteis após o início do projeto. O site é entregue pronto para receber visitantes e gerar contatos pelo WhatsApp.",
                  },
                },
                {
                  "@type": "Question",
                  name: "O site vai aparecer nas buscas do Google?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Todos os sites da V2 Digital são entregues com SEO local configurado, aumentando as chances de aparecer nas buscas do Google para o seu negócio e região.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Vocês fazem landing pages?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Sim! Criamos landing pages estratégicas focadas em conversão, ideais para campanhas no Instagram, Google Ads e WhatsApp.",
                  },
                },
              ],
            }),
          }}
        />

        {/* Google Analytics 4 */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');`}
        </Script>

        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');`}
        </Script>
      </head>

      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
