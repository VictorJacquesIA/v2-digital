/**
 * Formulário final da landing: quatro campos — Nome do negócio, Nome do
 * responsável, WhatsApp e Link do Google Maps ou cidade. Os checkboxes de
 * opcionais e o select de objetivo principal saíram do roteiro e não voltam
 * sem o cliente pedir.
 */

export type Contato = {
  nome: string;
  responsavel: string;
  telefone: string;
  maps: string;
};

export type Erros = {
  nome?: string | undefined;
  responsavel?: string | undefined;
  telefone?: string | undefined;
  maps?: string | undefined;
};

export const NOME_VAZIO = "Informe o nome do seu negócio";
export const RESPONSAVEL_VAZIO = "Informe o nome do responsável";
export const WHATSAPP_VAZIO = "Informe seu WhatsApp para a gente chamar";
export const MAPS_VAZIO = "Cole o link do seu perfil no Google Maps ou escreva a cidade";

/** Os quatro campos são obrigatórios. Vazio ou só espaços não vale. */
export function contatoErros(c: Contato): Erros {
  const erros: Erros = {};
  if (!c.nome.trim()) erros.nome = NOME_VAZIO;
  if (!c.responsavel.trim()) erros.responsavel = RESPONSAVEL_VAZIO;
  if (!c.telefone.trim()) erros.telefone = WHATSAPP_VAZIO;
  if (!c.maps.trim()) erros.maps = MAPS_VAZIO;
  return erros;
}

/** Mensagem levada ao WhatsApp com os quatro campos do formulário. */
export function contatoMensagem(c: Contato): string {
  return [
    "Olá! Vim pelo site da V2 Digital.",
    `Negócio: ${c.nome.trim()}`,
    `Responsável: ${c.responsavel.trim()}`,
    `WhatsApp: ${c.telefone.trim()}`,
    `Google Maps ou cidade: ${c.maps.trim()}`,
  ].join("\n");
}
