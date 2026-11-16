import { describe, expect, it } from "vitest";
import { estaAtiva, expiracaoDe } from "@/lib/estrategia-link";

describe("link da estratégia", () => {
  const base = new Date("2026-11-16T00:00:00Z");
  it("expira exatamente 3 dias após a geração", () => {
    expect(expiracaoDe(base).toISOString()).toBe("2026-11-19T00:00:00.000Z");
  });
  it("fica disponível antes de completar 3 dias", () => {
    expect(estaAtiva("2026-11-19T00:00:00Z", new Date("2026-11-18T23:59:00Z"))).toBe(true);
  });
  it("bloqueia depois de 3 dias", () => {
    expect(estaAtiva("2026-11-19T00:00:00Z", new Date("2026-11-19T00:00:01Z"))).toBe(false);
  });
});
