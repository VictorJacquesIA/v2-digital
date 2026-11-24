import { describe, expect, it } from "vitest";
import {
  PESOS,
  buildReport,
  categoriaUtil,
  categoriaDoPerfil,
  mesmoSegmento,
  segmentoDoNegocio,
  ehRedeSocial,
  explicacaoCurta,
  extrairCidade,
  vereditoDo,
  type PlaceLike,
} from "@/lib/simulador-score";

const alvoForte: PlaceLike = {
  id: "ChIJalvo",
  displayName: { text: "Padaria Central" },
  formattedAddress: "Av. Brasil, 500 - Centro, Imbituba - SC, 88780-000, Brasil",
  rating: 4.5,
  userRatingCount: 40,
  websiteUri: "https://padariacentral.com.br",
  nationalPhoneNumber: "(48) 3255-0000",
  primaryTypeDisplayName: { text: "Padaria" },
  photos: new Array(12).fill({}),
  regularOpeningHours: { periods: [{ openDay: "MONDAY" }] },
};

const alvoFraco: PlaceLike = {
  id: "ChIJfraco",
  displayName: { text: "Salão Bela Vida" },
  formattedAddress: "R. das Flores, 12 - Centro, Imbituba - SC, 88780-000, Brasil",
  rating: 3.9,
  userRatingCount: 5,
  websiteUri: "https://instagram.com/salaobelavida",
  photos: [],
};

const conc = (
  id: string,
  nome: string,
  avaliacoes: number,
  nota: number | null = null,
): PlaceLike => ({
  id,
  displayName: { text: nome },
  userRatingCount: avaliacoes,
  ...(nota === null ? {} : { rating: nota }),
});

describe("Simulador — leitura dos dados do Google", () => {
  it("puxa a cidade do endereço formatado", () => {
    expect(extrairCidade("Av. Brasil, 500 - Centro, Imbituba - SC, 88780-000, Brasil")).toBe("Imbituba");
    expect(extrairCidade("R. X, 9, Imbituba, SC")).toBe("Imbituba");
    expect(extrairCidade(undefined)).toBeNull();
  });

  it("trata link de rede social como se não fosse site próprio", () => {
    expect(ehRedeSocial("https://www.instagram.com/padaria")).toBe(true);
    expect(ehRedeSocial("https://wa.me/5554999507960")).toBe(true);
    expect(ehRedeSocial("https://padariacentral.com.br")).toBe(false);
    expect(ehRedeSocial(undefined)).toBe(false);
  });

  it("não usa 'Ponto de interesse' como categoria para comparar concorrentes", () => {
    expect(categoriaUtil({ primaryTypeDisplayName: { text: "Ponto de interesse" } })).toBe("");
    expect(categoriaUtil({ primaryTypeDisplayName: { text: "Policlínica" } })).toBe("Policlínica");
    expect(categoriaUtil({})).toBe("");
  });

  it("os pesos dos critérios fecham em 100", () => {
    const soma = Object.values(PESOS).reduce((a, b) => a + b, 0);
    expect(soma).toBe(100);
  });
});

describe("Simulador — relatório com dados reais", () => {
  const busca = [
    conc("c1", "Padaria do Zé", 20, 4.6),
    alvoForte,
    conc("c2", "Panificadora Sul", 30, 4.4),
    conc("c3", "Pão Quente", 40, 4.8),
  ];

  it("marca Top 3 e soma a nota cheia de um perfil completo", () => {
    const r = buildReport({ alvo: alvoForte, busca, posicao: 2, buscaUsada: "Padaria em Imbituba" });

    expect(r.posicaoRotulo).toBe("2º lugar");
    expect(r.posicaoStatus).toBe("ok");
    expect(r.mediaTop3).toBe(30);
    expect(r.criterios).toHaveLength(5);
    expect(r.indice).toBe(96);
    expect(r.criterios.map((c) => c.criterio)).toEqual([
      "Quantidade de avaliações",
      "Nota em estrelas",
      "Site próprio",
      "Fotos e horários",
      "Presença nas respostas de IA",
    ]);
    expect(r.criterios[3]?.situacao).toContain("10 ou mais fotos");
    expect(r.criterios[3]?.situacao).toContain("horários de funcionamento publicados");
  });

  it("lista os 3 primeiros da busca com nome, nota e volume reais", () => {
    const r = buildReport({ alvo: alvoForte, busca, posicao: 2, buscaUsada: "Padaria em Imbituba" });

    expect(r.top3).toMatchObject([
      { posicao: 1, nome: "Padaria do Zé", nota: 4.6, avaliacoes: 20, voce: false },
      { posicao: 2, nome: "Padaria Central", nota: 4.5, avaliacoes: 40, voce: true },
      { posicao: 3, nome: "Panificadora Sul", nota: 4.4, avaliacoes: 30, voce: false },
    ]);
    expect(r.concorrentes).toBe(3);
  });

  it("diz quando não deu para comparar com a cidade", () => {
    const r = buildReport({ alvo: alvoForte, busca: [], posicao: null });
    expect(r.buscaUsada).toBe("");
    expect(r.top3).toHaveLength(0);
    expect(r.criterios[0]?.situacao).toBe("Sem concorrentes comparáveis na cidade — não deu para avaliar a quantidade de avaliações");
    expect(r.resumo).toContain("não foi possível comparar com a cidade");
    expect(r.resumo).not.toContain("média dos 3 primeiros");
  });

  it("põe fora do top 10 e nota baixa em vermelho", () => {
    const r = buildReport({
      alvo: alvoFraco,
      busca: [conc("c1", "Salão A", 60, 4.7), conc("c2", "Salão B", 90, 4.8), conc("c3", "Salão C", 120, 4.9)],
      posicao: null,
      buscaUsada: "Salão de Beleza em Imbituba",
    });

    expect(r.posicaoRotulo).toBe("Fora do Top 10");
    expect(r.posicaoStatus).toBe("critico");
    expect(r.temSite).toBe(false);
    expect(r.mediaTop3).toBe(90);
    expect(r.indice).toBe(13);
    expect(r.criterios.find((c) => c.criterio === "Site próprio")?.status).toBe("melhorar");
    expect(r.criterios.find((c) => c.criterio === "Fotos e horários")?.status).toBe("critico");
  });

  it("leva nome, posição, nota e índice para o resumo do WhatsApp", () => {
    const r = buildReport({
      alvo: alvoFraco,
      busca: [conc("c1", "Salão A", 60), conc("c2", "Salão B", 90), conc("c3", "Salão C", 120)],
      posicao: null,
      buscaUsada: "Salão de Beleza em Imbituba",
    });

    expect(r.resumo).toContain("Salão Bela Vida");
    expect(r.resumo).toContain("Fora do Top 10");
    expect(r.resumo).toContain("3,9 ★ (5 avaliações)");
    expect(r.resumo).toContain("13 / 100");
    expect(r.resumo).toContain("média dos 3 primeiros: 90");
  });

  it("nunca passa de 100 nem fica abaixo de 0", () => {
    const tudo = buildReport({ alvo: alvoForte, busca: [alvoForte], posicao: 1 });
    const nada = buildReport({ alvo: { id: "x" }, busca: [], posicao: null });

    expect(tudo.indice).toBeLessThanOrEqual(100);
    expect(nada.indice).toBeGreaterThanOrEqual(0);
    expect(nada.indice).toBe(0);
    expect(nada.nome).toBe("Perfil sem nome no Google");
  });
});

describe("Simulador — presença nas respostas de IA", () => {
  it("nunca dá OK absoluto quando os 5 campos básicos estão cheios", () => {
    const r = buildReport({ alvo: alvoForte, busca: [], posicao: null });
    const ia = r.criterios.find((c) => c.criterio === "Presença nas respostas de IA");

    expect(r.camposBasicosFaltando).toEqual([]);
    expect(ia?.status).toBe("melhorar");
    expect(ia?.situacao).toBe(
      "Dados básicos ok (site, horário, telefone, categoria, fotos). Falta reforçar descrição, serviços e avaliações com palavras-chave para o ChatGPT e as outras IAs citarem sua empresa.",
    );
  });

  it("lista o que falta quando o perfil está incompleto", () => {
    const r = buildReport({ alvo: alvoFraco, busca: [], posicao: null });
    const ia = r.criterios.find((c) => c.criterio === "Presença nas respostas de IA");

    expect(r.camposBasicosFaltando).toEqual(["site", "horário", "telefone", "categoria", "fotos"]);
    expect(ia?.status).toBe("critico");
    expect(ia?.situacao).toBe(
      "0 de 5 campos que a IA lê estão preenchidos. Faltam: site, horário, telefone, categoria, fotos.",
    );
  });

  it("usa o singular quando falta um único campo", () => {
    const alvoSemSite: PlaceLike = {
      id: "ChIJsemSite",
      displayName: { text: "Ótica Vista" },
      formattedAddress: "Av. Brasil, 10 - Centro, Imbituba - SC, 88780-000, Brasil",
      rating: 4.8,
      userRatingCount: 200,
      nationalPhoneNumber: "(48) 3255-0000",
      primaryTypeDisplayName: { text: "Ótica" },
      photos: new Array(12).fill({}),
      regularOpeningHours: { periods: [{ openDay: "MONDAY" }] },
    };
    const r = buildReport({ alvo: alvoSemSite, busca: [], posicao: null });

    expect(r.camposBasicosFaltando).toEqual(["site"]);
    expect(r.criterios.find((c) => c.criterio === "Presença nas respostas de IA")?.situacao).toBe(
      "4 de 5 campos que a IA lê estão preenchidos. Falta: site.",
    );
  });
});

describe("Simulador — veredito", () => {
  it("chama de invisível quem tem nota boa e volume baixo", () => {
    expect(
      vereditoDo({
        nome: "Ótica Vista",
        nota: 4.8,
        avaliacoes: 12,
        mediaTop3: 90,
        posicao: 7,
        semComparavel: false,
      }),
    ).toBe(
      "Ótica Vista tem boa reputação, mas está invisível. A nota é 4,8★, só que são 12 avaliações contra 90 dos 3 primeiros. Hoje é o volume, não a qualidade, que está empurrando clientes para o concorrente.",
    );
  });

  it("aponta a nota quando ela está abaixo da meta de conversão", () => {
    expect(
      vereditoDo({
        nome: "Salão Bela Vida",
        nota: 4.2,
        avaliacoes: 40,
        mediaTop3: 30,
        posicao: 2,
        semComparavel: false,
      }),
    ).toBe(
      "A nota de Salão Bela Vida (4,2★) está abaixo da meta de conversão local (4,7★). Isso afasta clientes antes mesmo da ligação.",
    );
  });

  it("manda proteger a posição de quem já está no Top 3", () => {
    expect(
      vereditoDo({
        nome: "Ótica Vista",
        nota: 4.8,
        avaliacoes: 120,
        mediaTop3: 90,
        posicao: 2,
        semComparavel: false,
      }),
    ).toBe("Ótica Vista já está no Top 3. O foco agora é proteger a posição e transformar visibilidade em ligações.");
  });

  it("diz que falta visibilidade quando nota e volume estão bons mas a posição não", () => {
    const v = vereditoDo({
      nome: "Ótica Vista",
      nota: 4.8,
      avaliacoes: 120,
      mediaTop3: 90,
      posicao: 7,
      semComparavel: false,
      buscaUsada: "Ótica em Imbituba",
    });

    expect(v).toContain("4,8★");
    expect(v).toContain("acima da média de 90");
    expect(v).toContain("7º lugar");
    expect(v).toContain("Ótica em Imbituba");
    expect(v).toContain("O que falta é visibilidade, não reputação.");
  });

  it("avisa quando o perfil ainda não tem nota", () => {
    expect(
      vereditoDo({
        nome: "Loja Nova",
        nota: null,
        avaliacoes: 0,
        mediaTop3: 45,
        posicao: null,
        semComparavel: false,
      }),
    ).toContain("Loja Nova ainda não tem nota no Google");
  });

  it("o veredito do relatório nunca promete posição", () => {
    const r = buildReport({ alvo: alvoForte, busca: [], posicao: null });
    expect(r.veredito).not.toMatch(/garant/i);
    expect(r.resumo).toContain(r.veredito);
  });
});

describe("Simulador — explicação curta por critério", () => {
  it("compara o volume de avaliações com a média do Top 3", () => {
    const r = buildReport({
      alvo: alvoForte,
      busca: [conc("c1", "Padaria do Zé", 20), conc("c2", "Panificadora Sul", 30), conc("c3", "Pão Quente", 40)],
      posicao: 5,
      buscaUsada: "Padaria em Imbituba",
    });
    const av = r.criterios.find((c) => c.criterio === "Quantidade de avaliações");

    expect(av && explicacaoCurta(av, r)).toBe(
      "40 avaliações contra a média de 30 dos 3 primeiros da cidade.",
    );
  });

  it("diz quantos campos básicos faltam para a IA", () => {
    const r = buildReport({ alvo: alvoFraco, busca: [], posicao: null });
    const ia = r.criterios.find((c) => c.criterio === "Presença nas respostas de IA");

    expect(ia && explicacaoCurta(ia, r)).toBe(
      "Faltam site, horário, telefone, categoria, fotos para a IA conseguir descrever seu negócio.",
    );
  });
});

describe("segmento dos concorrentes", () => {
  const una = {
    displayName: { text: "UNA Reforma e Construção | Reformas Florianópolis" },
    primaryType: "service",
    primaryTypeDisplayName: { text: "Serviços" },
    types: ["general_contractor", "point_of_interest", "service", "establishment"],
  };
  it("empresa marcada como 'Serviços' é comparada pelo tipo específico", () => {
    expect(segmentoDoNegocio(una)).toEqual({ rotulo: "empresa de reforma e construção", tipo: "general_contractor" });
  });
  it("descarta concorrente de outro segmento (limpeza, cuidadores)", () => {
    const seg = segmentoDoNegocio(una)!;
    expect(mesmoSegmento(seg, { types: ["service", "point_of_interest"] })).toBe(false);
    expect(mesmoSegmento(seg, { types: ["general_contractor"] })).toBe(true);
  });
  it("sem tipo específico, usa palavras do nome", () => {
    expect(segmentoDoNegocio({ displayName: { text: "Obras Silva" }, primaryTypeDisplayName: { text: "Serviços" } })?.rotulo)
      .toBe("empresa de reforma e construção");
  });
});

it("na nota do perfil, categoria 'Serviços' conta como não preenchida", () => {
  expect(categoriaDoPerfil({ primaryTypeDisplayName: { text: "Serviços" } })).toBe("");
});

describe("Posição em várias buscas", () => {
  const busca: PlaceLike[] = [conc("c1", "Padaria Centro", 20, 4.6), alvoForte, conc("c2", "Panificadora Sul", 30, 4.4)];
  it("guarda as buscas extras e a data no relatório", () => {
    const r = buildReport({
      alvo: alvoForte,
      busca,
      posicao: 2,
      buscaUsada: "Padaria em Imbituba",
      buscas: [
        { rotulo: "Busca pela cidade", termo: "Padaria em Imbituba", posicao: 2 },
        { rotulo: "Quem procura o melhor", termo: "melhor Padaria em Imbituba", posicao: null },
      ],
      geradoEm: "2026-11-23T12:00:00.000Z",
    });
    expect(r.buscas).toHaveLength(2);
    expect(r.buscas?.[1]?.posicao).toBeNull();
    expect(r.geradoEm).toBe("2026-11-23T12:00:00.000Z");
  });

  it("diagnóstico sem buscas extras continua igual", () => {
    const r = buildReport({ alvo: alvoForte, busca, posicao: 2, buscaUsada: "Padaria em Imbituba" });
    expect(r.buscas).toBeUndefined();
    expect(r.geradoEm).toBeUndefined();
  });
});

describe("Pacote 1: alerta, avaliação recente e ações", () => {
  it("acha a avaliação mais recente e escreve há quanto tempo", async () => {
    const { maisRecente, diasDesde, haQuanto } = await import("@/lib/simulador-score");
    const iso = maisRecente([{ publishTime: "2026-05-01T10:00:00Z" }, { publishTime: "2026-08-20T10:00:00Z" }]);
    expect(iso).toBe("2026-08-20T10:00:00.000Z");
    const dias = diasDesde(iso, new Date("2026-11-23T10:00:00Z"));
    expect(haQuanto(dias)).toBe("há 3 meses");
    expect(haQuanto(diasDesde("2026-11-20T10:00:00Z", new Date("2026-11-23T10:00:00Z")))).toBe("há 3 dias");
    expect(maisRecente([])).toBeNull();
  });

  it("monta até 3 ações, da mais urgente, só para falhas reais", async () => {
    const { acoesDeHoje } = await import("@/lib/simulador-score");
    const acoes = acoesDeHoje({
      fechado: "temporario", temHorarios: false, fotos: 2, temSite: false, social: false,
      temTelefone: true, temCategoria: true, avaliacoes: 3, mediaTop3: 50, ultimaAvaliacao: null,
    });
    expect(acoes).toHaveLength(3);
    expect(acoes[0]!.titulo).toMatch(/aberta/);
    expect(acoes[1]!.titulo).toMatch(/horário/);
    expect(acoes[2]!.titulo).toMatch(/avaliação/);
  });

  it("perfil completo e em dia não recebe ação inventada", async () => {
    const { acoesDeHoje } = await import("@/lib/simulador-score");
    const acoes = acoesDeHoje({
      temHorarios: true, fotos: 10, temSite: true, social: false, temTelefone: true, temCategoria: true,
      avaliacoes: 80, mediaTop3: 50, ultimaAvaliacao: "2026-11-20T10:00:00Z", agora: new Date("2026-11-23T10:00:00Z"),
    });
    expect(acoes).toHaveLength(0);
  });

  it("marca perfil fechado e guarda fotos e site dos concorrentes", () => {
    const fechado: PlaceLike = { ...alvoForte, userRatingCount: 1, businessStatus: "CLOSED_TEMPORARILY", reviews: [{ publishTime: "2026-01-01T00:00:00Z" }] };
    const r = buildReport({ alvo: fechado, busca: [fechado, conc("c2", "Outra", 30, 4.4)], posicao: 1, buscaUsada: "Padaria em Imbituba" });
    expect(r.fechado).toBe("temporario");
    expect(r.ultimaAvaliacao).toBe("2026-01-01T00:00:00.000Z");
    expect(r.acoes?.[0]?.titulo).toMatch(/aberta/);
    expect(r.top3[0]).toHaveProperty("fotos");
  });
});

describe("Pacote 2: teste na IA", () => {
  it("reconhece a empresa na resposta, com ou sem acento e sufixo", async () => {
    const { citaEmpresa } = await import("@/lib/diagnostico-extra");
    const resposta = "1. **Pet Shop Amigão** — ótimo banho e tosa\n2. Chef Pet Gourmet, bolos para cães\n3. Clínica Veterinária São José";
    expect(citaEmpresa(resposta, "Chef Pet Gourmet")).toBe(true);
    expect(citaEmpresa(resposta, "Pet Shop Amigao - São José")).toBe(true);
    expect(citaEmpresa(resposta, "Padaria Central")).toBe(false);
  });

  it("nome curto de uma palavra não dá falso positivo", async () => {
    const { citaEmpresa } = await import("@/lib/diagnostico-extra");
    expect(citaEmpresa("O melhor pet shop da cidade", "Pet")).toBe(false);
  });

  it("marca quais concorrentes a IA citou", async () => {
    const { montarIa } = await import("@/lib/diagnostico-extra");
    const ia = montarIa(
      { pergunta: "Qual a melhor padaria em X?", buscaWeb: false, texto: "Padaria do Zé e Panificadora Sul são boas opções." },
      "Padaria Central",
      ["Padaria do Zé", "Panificadora Sul", "Pão Quente"],
    );
    expect(ia.citado).toBe(false);
    expect(ia.concorrentesCitados).toEqual(["Padaria do Zé", "Panificadora Sul"]);
  });
});

describe("Cuidados do relatório", () => {
  it("não afirma a avaliação mais recente quando o Google não mostrou todas", () => {
    const alvo: PlaceLike = { ...alvoForte, userRatingCount: 40, reviews: [{ publishTime: "2024-01-01T00:00:00Z" }] };
    const r = buildReport({ alvo, busca: [alvo, conc("c2", "Outra", 30, 4.4)], posicao: 1, buscaUsada: "Padaria em Imbituba" });
    expect(r.ultimaAvaliacao).toBeUndefined();
    expect(JSON.stringify(r.acoes)).not.toMatch(/mais de 3 meses/);
  });

  it("lê o estado do endereço", async () => {
    const { extrairUf } = await import("@/lib/simulador-score");
    expect(extrairUf("Rua Luiz Fagundes, 798 - Praia Comprida, São José - SC, 88103-500, Brasil")).toBe("SC");
    expect(extrairUf("Sem endereço")).toBeNull();
  });
});
