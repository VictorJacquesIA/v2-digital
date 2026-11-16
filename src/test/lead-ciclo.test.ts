import { describe, expect, it } from "vitest";
import { abreNovoCiclo } from "@/lib/lead";

const DIA = 24 * 60 * 60 * 1000;
const agora = new Date("2026-11-16T12:00:00Z").getTime();

describe("novo ciclo do lead após 7 dias", () => {
  it("6 dias depois continua no mesmo atendimento", () => {
    expect(abreNovoCiclo(new Date(agora - 6 * DIA), agora)).toBe(false);
  });
  it("7 dias depois abre um novo ciclo", () => {
    expect(abreNovoCiclo(new Date(agora - 7 * DIA), agora)).toBe(true);
  });
});
