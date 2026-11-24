/*
 * Proposta montada pelo visitante: ele escolhe a oferta principal e os
 * complementos na página e manda tudo numa mensagem só pelo WhatsApp.
 */
import { COMPLEMENTOS, OFERTA } from "./content";

export type ItemProposta = { id: string; nome: string; detalhe?: string };

/** Itens que podem entrar na proposta, na ordem em que aparecem na página. */
export const ITENS_PROPOSTA: readonly ItemProposta[] = [
  { id: "oferta", nome: OFERTA.nome, detalhe: "reestruturação do Google + placa de avaliação" },
  ...COMPLEMENTOS.cards.map((c) => ({ id: `complemento-${c.n}`, nome: c.nome })),
];

/** Itens escolhidos, sempre na ordem da página e sem ids desconhecidos. */
export function itensEscolhidos(ids: readonly string[]): ItemProposta[] {
  return ITENS_PROPOSTA.filter((i) => ids.includes(i.id));
}

/** Liga ou desliga um item da proposta. */
export function alternarItem(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}

/** Linhas da mensagem com os itens escolhidos ("Quero uma proposta com:" + um por linha). */
export function linhasProposta(ids: readonly string[]): string[] {
  const itens = itensEscolhidos(ids);
  if (itens.length === 0) return [];
  return [
    "Quero uma proposta com:",
    ...itens.map((i) => `• ${i.nome}${i.detalhe ? ` (${i.detalhe})` : ""}`),
  ];
}

/** Mensagem completa para o botão "Enviar no WhatsApp" da barra da proposta. */
export function mensagemProposta(ids: readonly string[]): string {
  return ["Olá! Vim pelo site da V2 Digital.", ...linhasProposta(ids)].join("\n");
}
