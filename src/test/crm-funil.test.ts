import {
  agruparPorEtapa,
  camposDaMudanca,
  diasNaEtapa,
  estaEsfriando,
  linkWhatsapp,
  normalizarWhatsapp,
  receitaPrevista,
  totaisPorEtapa,
} from "@/lib/crm/funil";

const agora = new Date("2026-11-18T12:00:00Z");
const diasAtras = (d: number) => new Date(agora.getTime() - d * 86_400_000).toISOString();

describe("normalizarWhatsapp (unificação de oportunidades)", () => {
  it("trata o mesmo número em formatos diferentes como igual", () => {
    const formatos = ["(48) 99999-0001", "+55 48 99999-0001", "5548999990001", "48999990001"];
    expect(new Set(formatos.map(normalizarWhatsapp))).toEqual(new Set(["48999990001"]));
  });
  it("aceita fixo de 10 dígitos com e sem 55", () => {
    expect(normalizarWhatsapp("554832550000")).toBe("4832550000");
    expect(normalizarWhatsapp("(48) 3255-0000")).toBe("4832550000");
  });
  it("devolve null para vazio", () => {
    expect(normalizarWhatsapp("")).toBeNull();
    expect(normalizarWhatsapp(null)).toBeNull();
    expect(normalizarWhatsapp("sem número")).toBeNull();
  });
  it("monta o link com DDI e a mensagem codificada", () => {
    expect(linkWhatsapp("(48) 99999-0001", "Olá, tudo bem?")).toBe("https://wa.me/5548999990001?text=Ol%C3%A1%2C%20tudo%20bem%3F");
    expect(linkWhatsapp(null)).toBeNull();
  });
});

describe("tempo na etapa", () => {
  it("conta dias inteiros desde a entrada na etapa", () => {
    expect(diasNaEtapa(diasAtras(0.5), agora)).toBe(0);
    expect(diasNaEtapa(diasAtras(3), agora)).toBe(3);
  });
  it("marca como esfriando a partir de 5 dias, só em etapas abertas", () => {
    expect(estaEsfriando({ etapa: "contatado", etapa_desde: diasAtras(4) }, agora)).toBe(false);
    expect(estaEsfriando({ etapa: "contatado", etapa_desde: diasAtras(5) }, agora)).toBe(true);
    expect(estaEsfriando({ etapa: "fechado", etapa_desde: diasAtras(30) }, agora)).toBe(false);
    expect(estaEsfriando({ etapa: "perdido", etapa_desde: diasAtras(30) }, agora)).toBe(false);
  });
});

describe("colunas e totais do funil", () => {
  const ops = [
    { etapa: "novo", etapa_desde: diasAtras(1), valor_mensal: "300.00" },
    { etapa: "novo", etapa_desde: diasAtras(6), valor_mensal: 200 },
    { etapa: "proposta", etapa_desde: diasAtras(2), valor_mensal: "900" },
    { etapa: "fechado", etapa_desde: diasAtras(2), valor_mensal: 500 },
    { etapa: "perdido", etapa_desde: diasAtras(2), valor_mensal: 700 },
    { etapa: "etapa_invalida", etapa_desde: diasAtras(2), valor_mensal: 100 },
  ];
  it("agrupa por etapa, com o mais parado primeiro, e ignora etapa desconhecida", () => {
    const g = agruparPorEtapa(ops);
    expect(g.novo.map((o) => o.valor_mensal)).toEqual([200, "300.00"]);
    expect(Object.values(g).flat()).toHaveLength(5);
  });
  it("soma quantidade e valor por coluna, aceitando numeric em texto", () => {
    const t = totaisPorEtapa(ops);
    expect(t.novo).toEqual({ quantidade: 2, valor: 500 });
    expect(t.proposta).toEqual({ quantidade: 1, valor: 900 });
    expect(t.negociacao).toEqual({ quantidade: 0, valor: 0 });
  });
  it("receita prevista considera só oportunidades em aberto", () => {
    expect(receitaPrevista(ops)).toBe(1400);
  });
});

describe("mudança de etapa", () => {
  it("exige motivo para perdido", () => {
    expect(() => camposDaMudanca("perdido")).toThrow("motivo");
    expect(() => camposDaMudanca("perdido", "   ")).toThrow("motivo");
    expect(camposDaMudanca("perdido", "Preço")).toEqual({ etapa: "perdido", motivo_perda: "Preço" });
  });
  it("demais etapas não pedem motivo", () => {
    expect(camposDaMudanca("negociacao")).toEqual({ etapa: "negociacao" });
  });
});
