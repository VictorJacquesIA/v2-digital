import { describe, expect, it } from "vitest";
import { BUSCAS_POR_MINUTO, dentroDoLimite } from "@/lib/simulador.functions";

describe("Limite de buscas pelo nome da empresa", () => {
  it("aceita 5 buscas por minuto e recusa a sexta", () => {
    const ip = "10.0.0.1";
    const t = 1_000_000;
    for (let i = 0; i < BUSCAS_POR_MINUTO; i++) {
      expect(dentroDoLimite(ip, `sessao-${i}-abc`, t)).toBe(true);
    }
    expect(dentroDoLimite(ip, "sessao-extra-abc", t)).toBe(false);
  });

  it("digitar um nome inteiro conta como uma busca só", () => {
    const ip = "10.0.0.2";
    const t = 2_000_000;
    for (let i = 0; i < 6; i++) expect(dentroDoLimite(ip, "mesma-sessao", t)).toBe(true);
    for (let i = 1; i < BUSCAS_POR_MINUTO; i++) expect(dentroDoLimite(ip, `outra-${i}-sessao`, t)).toBe(true);
  });

  it("libera de novo depois de um minuto", () => {
    const ip = "10.0.0.3";
    const t = 3_000_000;
    for (let i = 0; i < BUSCAS_POR_MINUTO; i++) dentroDoLimite(ip, `s-${i}-xxxxxx`, t);
    expect(dentroDoLimite(ip, "s-nova-xxxxx", t)).toBe(false);
    expect(dentroDoLimite(ip, "s-nova-xxxxx", t + 61_000)).toBe(true);
  });

  it("uma sessão sozinha não passa de 15 pedidos", () => {
    const ip = "10.0.0.4";
    const t = 4_000_000;
    for (let i = 0; i < 15; i++) expect(dentroDoLimite(ip, "abusada-sessao", t)).toBe(true);
    expect(dentroDoLimite(ip, "abusada-sessao", t)).toBe(false);
  });
});
