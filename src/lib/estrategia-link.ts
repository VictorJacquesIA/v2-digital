export const VALIDADE_DIAS = 3;

export function expiracaoDe(base: Date = new Date()): Date {
  return new Date(base.getTime() + VALIDADE_DIAS * 24 * 60 * 60 * 1000);
}

export function estaAtiva(expira: string | null | undefined, agora: Date = new Date()): boolean {
  return !!expira && new Date(expira).getTime() > agora.getTime();
}

export function tempoRestante(expira: string | null | undefined, agora: Date = new Date()): string {
  if (!estaAtiva(expira, agora)) return "Expirado";
  const ms = new Date(expira!).getTime() - agora.getTime();
  const h = Math.ceil(ms / 3600000);
  if (h <= 24) return `Ativo (restam ${h}h)`;
  const d = Math.ceil(h / 24);
  return `Ativo (restam ${d} dias)`;
}
