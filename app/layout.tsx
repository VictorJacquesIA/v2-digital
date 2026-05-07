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

const BASE_URL = "https://v2-digital.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "V2 Digital | Sites de Alta Conversão para Negócios Locais",
  description:
    "Criamos sites e landing pages estratégicas para negócios em todo o Brasil. Páginas focadas em converter visitantes em contatos reais no WhatsApp. V2 Digital — Imbituba, SC.",
  keywords:
    "criação de sites, landing page, site para negócio local, site que converte, agência digital, Imbituba, Santa Catarina, Brasil, site profissional, site para WhatsApp",
  authors: [{ name: "V2 Digital" }],
  creator: "V2 Digital",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "V2 Digital | Sites que Transformam Visitantes em Clientes",
    description:
      "Criamos páginas estratégicas para negócios locais em todo o Brasil. Foco em conversão e contatos reais no WhatsApp.",
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
    >
      <head>
        {/* Schema.org LocalBusiness */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ProfessionalService",
              name: "V2 Digital",
              description: "Criamos sites e landing pages estratégicas para negócios em todo o Brasil, focados em converter visitantes em contatos reais no WhatsApp.",
              url: "https://v2-digital.vercel.app",
              telephone: "+5548991472902",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Imbituba",
                addressRegion: "SC",
                addressCountry: "BR",
              },
              areaServed: {
                "@type": "Country",
                name: "Brasil",
              },
              serviceType: ["Criação de Sites", "Landing Pages", "Sites de Alta Conversão"],
              sameAs: [
                "https://www.instagram.com/v2digital.site/",
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

      <body style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
