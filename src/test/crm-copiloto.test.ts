import { diasParado, filaFollowup, metricasSemana, precisaFollowup, qualificarPorMaps } from "@/lib/crm/copiloto";

const agora = new Date("2026-11-19T15:00:00Z").getTime();
const dias = (d: number) => new Date(agora - d * 86_400_000).toISOString();

describe("score de qualificação (SDR)", () => {
  it("nota 4,1 com 28 avaliações, sem site e com telefone é oportunidade alta", () => {
    const q = qualificarPorMaps({ rating: 4.1, userRatingCount: 28, nationalPhoneNumber: "(48) 3255-0000", photos: [1, 2, 3, 4, 5, 6], regularOpeningHours: { periods: [1] } });
    expect(q.score).toBe(65);
    expect(q.faixa).toBe("alta");
    expect(q.motivos).toContain("Sem site próprio");
  });
  it("negócio forte e com site tem nota baixa", () => {
    const q = qualificarPorMaps({ rating: 4.8, userRatingCount: 340, websiteUri: "https://padaria.com.br", nationalPhoneNumber: "1", photos: new Array(20).fill(0), regularOpeningHours: { periods: [1] } });
    expect(q.score).toBe(15);
    expect(q.faixa).toBe("baixa");
  });
  it("Instagram no lugar do site conta como falta de site", () => {
    const q = qualificarPorMaps({ websiteUri: "https://instagram.com/padaria", userRatingCount: 200, rating: 4.7, nationalPhoneNumber: "1", photos: new Array(9).fill(0), regularOpeningHours: { periods: [1] } });
    expect(q.motivos).toContain("Usa rede social no lugar de site");
  });
  it("sem telefone perde pontos e avisa o motivo", () => {
    const comTel = qualificarPorMaps({ nationalPhoneNumber: "1" }).score;
    const semTel = qualificarPorMaps({});
    expect(comTel - semTel.score).toBe(10);
    expect(semTel.motivos).toContain("Sem telefone no perfil");
  });
  it("nunca passa de 100", () => {
    expect(qualificarPorMaps({ rating: 2, nationalPhoneNumber: "1" }).score).toBeLessThanOrEqual(100);
  });
});

describe("regras de follow-up", () => {
  const sem = { temSugestaoPendente: false, temTarefaPendente: false };
  const op = (etapa: string, d: number, whatsapp: string | null = "48999990000") => ({ etapa, etapa_desde: dias(d), whatsapp });
  it("entra quem já foi contatado e está parado há 3 dias ou mais", () => {
    expect(precisaFollowup(op("contatado", 3), sem, agora)).toBe(true);
    expect(precisaFollowup(op("contatado", 2), sem, agora)).toBe(false);
  });
  it("uma atividade recente zera o relógio", () => {
    expect(precisaFollowup(op("proposta", 10), { ...sem, ultimaAtividadeEm: dias(1) }, agora)).toBe(false);
    expect(diasParado({ etapa_desde: dias(10) }, dias(4), agora)).toBe(4);
  });
  it("não entra: etapa Novo, fechado, perdido, sem WhatsApp, com sugestão ou tarefa pendente", () => {
    expect(precisaFollowup(op("novo", 9), sem, agora)).toBe(false);
    expect(precisaFollowup(op("fechado", 9), sem, agora)).toBe(false);
    expect(precisaFollowup(op("perdido", 9), sem, agora)).toBe(false);
    expect(precisaFollowup(op("contatado", 9, null), sem, agora)).toBe(false);
    expect(precisaFollowup(op("contatado", 9), { ...sem, temSugestaoPendente: true }, agora)).toBe(false);
    expect(precisaFollowup(op("contatado", 9), { ...sem, temTarefaPendente: true }, agora)).toBe(false);
  });
  it("fila ordena do mais parado para o menos e respeita o limite", () => {
    const ops = [3, 9, 5, 12].map((d, i) => ({ id: String(i), ...op("contatado", d) }));
    const fila = filaFollowup(ops, () => sem, agora, 3);
    expect(fila.map((f) => f.dias)).toEqual([12, 9, 5]);
  });
});

describe("métricas da semana (analista)", () => {
  const ops = [
    { id: "a", etapa: "proposta", etapa_desde: dias(2), created_at: dias(3), fechado_em: null, motivo_perda: null, valor_mensal: 900 },
    { id: "b", etapa: "fechado", etapa_desde: dias(1), created_at: dias(20), fechado_em: dias(1), motivo_perda: null, valor_mensal: "500" },
    { id: "c", etapa: "perdido", etapa_desde: dias(2), created_at: dias(15), fechado_em: null, motivo_perda: "Preço", valor_mensal: 0 },
    { id: "d", etapa: "contatado", etapa_desde: dias(8), created_at: dias(9), fechado_em: null, motivo_perda: null, valor_mensal: 0 },
  ];
  const mov = (id: string, de: string, para: string, d: number) => ({ oportunidade_id: id, tipo: "mudanca_etapa", metadados: { de, para }, created_at: dias(d) });
  const movimentos = [
    mov("a", "novo", "contatado", 6), mov("a", "contatado", "proposta", 2),
    mov("b", "novo", "contatado", 15), mov("b", "contatado", "fechado", 1),
    mov("c", "novo", "contatado", 10), mov("c", "contatado", "perdido", 2),
    mov("d", "novo", "contatado", 8),
  ];
  const m = metricasSemana(ops, movimentos, agora);
  it("conta novos, fechados, perdidos e receita da semana", () => {
    expect(m).toMatchObject({ novos: 1, fechados: 1, perdidos: 1, receitaFechada: 500 });
  });
  it("taxa de resposta: 2 de 4 contatados avançaram (perdido não conta)", () => {
    expect(m.taxaResposta).toBe(50);
  });
  it("lista motivos de perda e onde os contatos estão travando", () => {
    expect(m.motivosPerda).toEqual([{ motivo: "Preço", total: 1 }]);
    expect(m.paradosPorEtapa).toEqual([{ etapa: "Contatado", total: 1 }]);
  });
});

describe("limpeza do texto da IA", () => {
  it("decodifica %u00e9 e \u00e9 e tira emoji", async () => {
    const { limparTexto } = await import("@/lib/crm/copiloto-ia");
    expect(limparTexto("Ol%u1f44b, aqui %u00e9 o Victor. Fa%u00e7o um diagn\u00f3stico 😀 gratuito !")).toBe("Ol, aqui é o Victor. Faço um diagnóstico gratuito!");
    expect(limparTexto("Olá, tudo bem? 👋🏽")).toBe("Olá, tudo bem?");
  });
});
