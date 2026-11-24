import trafego from "@/assets/icons/trafego-pago.svg";
import sites from "@/assets/icons/sites-landing-pages.svg";
import google from "@/assets/icons/google-meu-negocio.svg";
import placa from "@/assets/icons/placa-avaliacoes.svg";

/**
 * Ícones dos cards de complemento, chaveados pelo número do card. Se o roteiro
 * ganhar um card sem ícone correspondente, o typecheck avisa.
 */
export const ICONES_COMPLEMENTO = {
  "01": google,
  "02": trafego,
  "03": sites,
} as const;

/** Ícone da oferta principal. */
export const ICONE_OFERTA = placa;
