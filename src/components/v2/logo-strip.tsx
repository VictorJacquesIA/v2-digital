import celebra from "@/assets/ds/cliente-celebra.png.asset.json";
import mazaro from "@/assets/ds/cliente-mazaro.png.asset.json";
import ro from "@/assets/ds/cliente-ro-trim.png.asset.json";
import chefpet from "@/assets/ds/cliente-chefpet.webp.asset.json";
import livmiart from "@/assets/ds/cliente-livmiart.png.asset.json";
import ummaisum from "@/assets/ds/cliente-ummaisum.webp.asset.json";
import nfcorretor from "@/assets/ds/cliente-nfcorretor.webp.asset.json";
import barbara from "@/assets/ds/cliente-barbara.png.asset.json";

/**
 * Faixa de logos de clientes (marquee), com o nome da empresa abaixo de cada logo.
 * Para adicionar um cliente, suba a imagem como asset em src/assets/ds e inclua
 * um item aqui. `tone` escolhe o tratamento monocromático:
 * - "padrao": grayscale + contraste (logos já escuras/coloridas)
 * - "escura": brightness reduzido + contraste alto (logos claras/douradas)
 * - "chefpet": brightness leve + contraste (logo com fundo claro fechado)
 * - "invertida": inverte (logos com fundo preto sólido)
 * - "clara": escurece forte (logos claras sobre fundo transparente)
 * `wide: true` reduz a altura para manter o peso visual de logos horizontais.
 */
export const CLIENT_LOGOS: Array<{
  name: string;
  servico: string;
  src: string;
  tone: "padrao" | "escura" | "chefpet" | "invertida" | "clara";
  wide?: boolean;
  big?: boolean;
}> = [
  { name: "Celebra Cestas SC", servico: "Tráfego pago", src: celebra.url, tone: "padrao" },
  { name: "Livmiart Store", servico: "Site", src: livmiart.url, tone: "invertida" },
  { name: "Mazaro", servico: "Site + Tráfego pago", src: mazaro.url, tone: "padrao", wide: true },
  { name: "Rô Espaço Terapêutico", servico: "Site + Google Meu Negócio", src: ro.url, tone: "escura", big: true },
  { name: "Chef Pet Gourmet", servico: "Site + Tráfego pago", src: chefpet.url, tone: "chefpet" },
  { name: "Um mais UM", servico: "Tráfego pago", src: ummaisum.url, tone: "padrao" },
  { name: "NF Corretor de Imóveis", servico: "Tráfego pago", src: nfcorretor.url, tone: "clara", wide: true },
  { name: "Bárbara Souza Corretora de Imóveis", servico: "Tráfego pago", src: barbara.url, tone: "padrao" },
];

function Logo({ logo }: { logo: (typeof CLIENT_LOGOS)[number] }) {
  const classes = [
    "logo-strip-img",
    `logo-strip-${logo.tone}`,
    logo.wide ? "logo-strip-wide" : "",
    logo.big ? "logo-strip-big" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="logo-strip-item">
      <span className="logo-strip-slot">
        <img className={classes} src={logo.src} alt="" loading="lazy" />
      </span>
      <span className="logo-strip-nome">{logo.name}</span>
      <span className="logo-strip-servico">{logo.servico}</span>
    </div>
  );
}

export function LogoStrip() {
  return (
    <section className="logo-strip" aria-label="Empresas atendidas pela V2">
      <div className="logo-strip-viewport">
        <div className="logo-strip-track">
          <div className="logo-strip-group">
            {CLIENT_LOGOS.map((logo) => (
              <Logo key={logo.name} logo={logo} />
            ))}
          </div>
          <div className="logo-strip-group" aria-hidden="true">
            {CLIENT_LOGOS.map((logo) => (
              <Logo key={logo.name} logo={logo} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
