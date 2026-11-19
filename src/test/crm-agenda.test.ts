import { agruparTarefas, amanhaAsNove, esfriandoSemTarefa, paraInputLocal } from "@/lib/crm/agenda";

// Datas no horário local, como no navegador do painel
const agora = new Date(2026, 10, 19, 15, 30); // 19/11/2026 15:30
const em = (dia: number, hora = 10) => new Date(2026, 10, dia, hora).toISOString();
const t = (id: string, vence_em: string, concluida_em: string | null = null) => ({ id, vence_em, concluida_em });

describe("agruparTarefas", () => {
  const lista = [
    t("ontem", em(18)),
    t("hoje-cedo", em(19, 8)),
    t("hoje-noite", em(19, 23)),
    t("amanha", em(20)),
    t("dia7", em(26, 22)),
    t("dia8", em(27, 1)),
    t("feita", em(17), em(18)),
  ];
  const g = agruparTarefas(lista, agora);
  it("tarefa de hoje que já passou do horário continua em Hoje, não em Atrasadas", () => {
    expect(g.hoje.map((x) => x.id)).toEqual(["hoje-cedo", "hoje-noite"]);
  });
  it("atrasadas são as que venceram antes de hoje", () => {
    expect(g.atrasadas.map((x) => x.id)).toEqual(["ontem"]);
  });
  it("próximos 7 dias vão de amanhã até o fim do 7º dia", () => {
    expect(g.proximos7.map((x) => x.id)).toEqual(["amanha", "dia7"]);
    expect(g.depois.map((x) => x.id)).toEqual(["dia8"]);
  });
  it("concluídas ficam separadas, mesmo vencidas", () => {
    expect(g.concluidas.map((x) => x.id)).toEqual(["feita"]);
  });
});

describe("esfriandoSemTarefa (regra de follow-up)", () => {
  const dias = (d: number) => new Date(agora.getTime() - d * 86_400_000).toISOString();
  const ops = [
    { id: "parado", etapa: "contatado", etapa_desde: dias(6) },
    { id: "parado-com-tarefa", etapa: "proposta", etapa_desde: dias(10) },
    { id: "parado-tarefa-feita", etapa: "negociacao", etapa_desde: dias(8) },
    { id: "recente", etapa: "contatado", etapa_desde: dias(2) },
    { id: "fechado", etapa: "fechado", etapa_desde: dias(30) },
  ];
  const tarefas = [
    { oportunidade_id: "parado-com-tarefa", concluida_em: null },
    { oportunidade_id: "parado-tarefa-feita", concluida_em: dias(1) },
  ];
  it("lista quem está parado 5+ dias em etapa aberta e sem tarefa pendente, o mais antigo primeiro", () => {
    expect(esfriandoSemTarefa(ops, tarefas, agora).map((o) => o.id)).toEqual(["parado-tarefa-feita", "parado"]);
  });
});

describe("datas de apoio", () => {
  it("amanhã às 9h no horário local", () => {
    const d = amanhaAsNove(agora);
    expect([d.getDate(), d.getHours(), d.getMinutes()]).toEqual([20, 9, 0]);
  });
  it("formata para datetime-local", () => {
    expect(paraInputLocal(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05T07:03");
  });
});
