/*
 * Validação do WhatsApp pedido no formulário do diagnóstico gratuito.
 * Aceita formatos livres ((54) 99950-7960, 54999507960, +55 54 ...): o que
 * importa é a quantidade de dígitos — 10 a 13 cobre DDD + número, com ou sem
 * o código do país.
 */

export const WHATSAPP_INVALIDO = "Informe um WhatsApp válido, com DDD";

export function whatsappValido(valor: string): boolean {
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 10 && digitos.length <= 13;
}

export const CAPTURA_FALHOU = "Não foi possível salvar seu WhatsApp. Tente novamente para liberar o diagnóstico.";

/**
 * Grava o contato e devolve a linha salva. A análise só roda depois da
 * confirmação da gravação, nunca de melhor esforço.
 */
export async function capturarWhatsApp<T>(
  valor: string,
  salvar: (whatsapp: string) => PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T> {
  if (!whatsappValido(valor)) throw new Error(WHATSAPP_INVALIDO);
  const { data, error } = await salvar(valor.trim());
  if (error || data === null) throw new Error(CAPTURA_FALHOU);
  return data;
}

/** Depois de 7 dias da última interação, o mesmo contato abre um novo ciclo de atendimento. */
export const SETE_DIAS = 7 * 24 * 60 * 60 * 1000;
export function abreNovoCiclo(ultimaInteracao: string | Date, agora = Date.now()): boolean {
  return agora - new Date(ultimaInteracao).getTime() >= SETE_DIAS;
}
