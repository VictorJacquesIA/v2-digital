/*
 * Lógica pura do simulador "Diagnóstico Google Meu Negócio".
 *
 * Só recebe dados que a Google Places API (New) devolveu de verdade e devolve o
 * relatório. Nada aqui inventa número: o que a API não trouxe aparece como
 * "sem dado" e pontua zero.
 */

export type SimStatus = "ok" | "melhorar" | "critico";

export type SimCriterion = {
  criterio: string;
  situacao: string;
  status: SimStatus;
  /** 1 = pesa mais na decisão do cliente. Usado para ordenar "O que mais pesa". */
  prioridade: number;
};

/** Um negócio da busca local, como o Google devolve. Só dados públicos. */
export type SimConcorrente = {
  posicao: number;
  nome: string;
  nota: number | null;
  avaliacoes: number;
  /** true quando a linha é o próprio perfil do cliente. */
  voce: boolean;
};

export type SimReport = {
  nome: string;
  endereco: string;
  cidade: string | null;
  categoria: string;
  posicao: number | null;
  posicaoRotulo: string;
  posicaoStatus: SimStatus;
  buscaUsada: string;
  nota: number | null;
  avaliacoes: number;
  mediaTop3: number;
  /** Quantos outros negócios entraram na comparação. */
  concorrentes: number;
  /** Os 3 primeiros da busca local, com a posição que cada um ocupou. */
  top3: SimConcorrente[];
  fotos: number;
  site: string | null;
  temSite: boolean;
  temHorarios: boolean;
  /** Campos básicos que faltam para a IA descrever o negócio. Vazio = todos ok. */
  camposBasicosFaltando: string[];
  indice: number;
  criterios: SimCriterion[];
  veredito: string;
  resumo: string;
};

export type PlaceLike = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  primaryTypeDisplayName?: { text?: string };
  primaryType?: string;
  types?: string[];
  photos?: unknown[];
  regularOpeningHours?: { periods?: unknown[] };
  attribution?: string;
};

/** Pontos de cada critério. A soma fecha em 100. */
export const PESOS = {
  posicao: 22,
  avaliacoes: 22,
  nota: 14,
  site: 14,
  fotos: 10,
  horarios: 8,
  ia: 10,
} as const;

const REDES_SOCIAIS = [
  "facebook.com",
  "m.me",
  "instagram.com",
  "wa.me",
  "whatsapp.com",
  "whatsapp.net",
  "api.whatsapp.com",
  "linktr.ee",
  "tiktok.com",
  "youtube.com",
  "twitter.com",
  "x.com",
];

export function extrairCidade(address?: string): string | null {
  if (!address) return null;
  const bairroCidade = /([^,()/]+?)\s*-\s*([A-Z]{2}),\s*\d{5}/.exec(address);
  if (bairroCidade && bairroCidade[1]) return bairroCidade[1].trim();
  const cidadeEstado = /,\s*([A-Za-zÀ-ÿ'´^~` ]{3,}?)\s*,\s*[A-Z]{2}\b/.exec(address);
  return cidadeEstado && cidadeEstado[1] ? cidadeEstado[1].trim() : null;
}

export function ehRedeSocial(uri?: string): boolean {
  if (!uri) return false;
  let host = "";
  try {
    host = new URL(uri).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return false;
  }
  return REDES_SOCIAIS.some((h) => host === h || host.endsWith(`.${h}`));
}

function rotuloPosicao(posicao: number | null): string {
  return posicao === null ? "Fora do Top 10" : `${posicao}º lugar`;
}

function mediaAvaliacoes(lista: PlaceLike[]): number {
  if (lista.length === 0) return 0;
  const soma = lista.reduce((acc, p) => acc + (p.userRatingCount ?? 0), 0);
  return Math.round(soma / lista.length);
}

function formatarNota(nota: number | null): string {
  return nota === null ? "sem nota" : nota.toFixed(1).replace(".", ",");
}

/** Concordância: "Falta site", mas "Faltam site e horário". */
function faltamPalavra(qtd: number): string {
  return qtd === 1 ? "Falta" : "Faltam";
}

const CATEGORIAS_GENERICAS = new Set([
  "ponto de interesse", "serviços", "serviço", "prestador de serviços",
  "estabelecimento", "empresa", "loja", "escritório corporativo",
]);
const TIPOS_GENERICOS = new Set([
  "point_of_interest", "establishment", "service", "store", "corporate_office", "premise",
]);

/** Rótulo de busca em pt-BR para tipos específicos do Google. */
const ROTULO_TIPO: Record<string, string> = {
  general_contractor: "empresa de reforma e construção",
  electrician: "eletricista", plumber: "encanador", roofing_contractor: "telhados",
  painter: "pintor", locksmith: "chaveiro", moving_company: "mudanças",
  real_estate_agency: "imobiliária", lawyer: "advogado", accounting: "contabilidade",
  dentist: "dentista", doctor: "médico", physiotherapist: "fisioterapeuta",
  beauty_salon: "salão de beleza", hair_care: "cabeleireiro", spa: "spa",
  restaurant: "restaurante", bakery: "padaria", cafe: "cafeteria",
  veterinary_care: "veterinário", pet_store: "pet shop", gym: "academia",
  car_repair: "oficina mecânica", insurance_agency: "corretora de seguros",
  florist: "floricultura", furniture_store: "loja de móveis",
};

/** Palavras do nome que revelam o segmento quando o Google só diz "Serviços". */
const SEGMENTO_NOME: [RegExp, string, string][] = [
  [/reforma|constru|obra|empreiteir|engenharia/i, "empresa de reforma e construção", "general_contractor"],
  [/imobili|corretor|im[oó]veis/i, "imobiliária", "real_estate_agency"],
  [/advoca|advogad/i, "advogado", "lawyer"],
  [/contab/i, "contabilidade", "accounting"],
  [/odonto|dentist/i, "dentista", "dentist"],
  [/fisioter/i, "fisioterapeuta", "physiotherapist"],
  [/terap|psic/i, "terapeuta", ""],
  [/cestas?|presentes/i, "cestas de presente", ""],
  [/pet/i, "pet shop", "pet_store"],
  [/limpeza|diarista/i, "empresa de limpeza", ""],
];

export type Segmento = { rotulo: string; tipo: string };

/**
 * Segmento usado para achar concorrentes. Ordem de confiança: tipo específico
 * do Google (ex.: general_contractor) → categoria exibida, se não for genérica
 * → palavras do nome do negócio. Nunca compara por "Serviços" ou "Ponto de
 * interesse", que puxam qualquer empresa da cidade.
 */
export function segmentoDoNegocio(alvo: PlaceLike): Segmento | null {
  const tipos = [alvo.primaryType, ...(alvo.types ?? [])].filter(
    (t): t is string => !!t && !TIPOS_GENERICOS.has(t),
  );
  const tipo = tipos[0] ?? "";
  if (tipo && ROTULO_TIPO[tipo]) return { rotulo: ROTULO_TIPO[tipo], tipo };
  const cat = alvo.primaryTypeDisplayName?.text?.trim() ?? "";
  if (cat && !CATEGORIAS_GENERICAS.has(cat.toLowerCase())) return { rotulo: cat, tipo };
  const nome = alvo.displayName?.text ?? "";
  for (const [re, rotulo, t] of SEGMENTO_NOME) if (re.test(nome)) return { rotulo, tipo: tipo || t };
  return null;
}

/** Categoria que o próprio perfil exibe no Google, vazia se for genérica. */
export function categoriaDoPerfil(alvo: PlaceLike): string {
  const c = alvo.primaryTypeDisplayName?.text?.trim() ?? "";
  return CATEGORIAS_GENERICAS.has(c.toLowerCase()) ? "" : c;
}

/** Mantido para compatibilidade: rótulo do segmento ou vazio. */
export function categoriaUtil(alvo: PlaceLike): string {
  return segmentoDoNegocio(alvo)?.rotulo ?? "";
}

/** Concorrente só conta se for do mesmo segmento (mesmo tipo do Google). */
export function mesmoSegmento(seg: Segmento, p: PlaceLike): boolean {
  if (!seg.tipo) return true;
  return p.primaryType === seg.tipo || (p.types ?? []).includes(seg.tipo);
}

/* ------------------------------------------------------------------ */
/* Leitura do que a busca local mostrou                                */
/* ------------------------------------------------------------------ */

/**
 * Os 3 primeiros da busca local, na ordem em que o Google os mostrou. A posição
 * de cada um é a que ele ocupou de fato — inclusive quando o perfil do cliente
 * é um deles, marcado em `voce`.
 */
function concorrentesDaBusca(alvo: PlaceLike, busca: PlaceLike[]): SimConcorrente[] {
  const out: SimConcorrente[] = [];
  for (const p of busca) {
    if (out.length >= 3) break;
    out.push({
      posicao: out.length + 1,
      nome: p.displayName?.text?.trim() || "Perfil sem nome no Google",
      nota: typeof p.rating === "number" ? p.rating : null,
      avaliacoes: p.userRatingCount ?? 0,
      voce: p.id !== undefined && p.id === alvo.id,
    });
  }
  return out;
}

/**
 * O veredito é a frase que abre o relatório. Ela só usa os números que a busca
 * local devolveu: nota, volume de avaliações e posição. Nunca promete posição.
 */
export function vereditoDo(args: {
  nome: string;
  nota: number | null;
  avaliacoes: number;
  mediaTop3: number;
  posicao: number | null;
  semComparavel: boolean;
  buscaUsada?: string;
}): string {
  const { nome, nota, avaliacoes, mediaTop3, posicao, semComparavel } = args;
  const estaNoTop3 = posicao !== null && posicao <= 3;
  const notaTexto = formatarNota(nota);

  // 1. Nota boa, volume baixo: o problema é aparecer, não a qualidade.
  if (nota !== null && nota >= 4.7 && !semComparavel && mediaTop3 > 0 && avaliacoes < mediaTop3) {
    return `${nome} tem boa reputação, mas está invisível. A nota é ${notaTexto}★, só que são ${avaliacoes} avaliações contra ${mediaTop3} dos 3 primeiros. Hoje é o volume, não a qualidade, que está empurrando clientes para o concorrente.`;
  }

  // 2. Nota abaixo da meta de conversão local.
  if (nota !== null && nota < 4.7) {
    return `A nota de ${nome} (${notaTexto}★) está abaixo da meta de conversão local (4,7★). Isso afasta clientes antes mesmo da ligação.`;
  }

  // 3. Já está no Top 3: o trabalho passa a ser proteger a posição.
  if (estaNoTop3) {
    return `${nome} já está no Top 3. O foco agora é proteger a posição e transformar visibilidade em ligações.`;
  }

  // 4. Nota boa e volume acima da média, mas fora do Top 3.
  if (nota !== null && nota >= 4.7) {
    const volume = semComparavel
      ? `${avaliacoes} avaliações e nenhuma base de comparação na cidade`
      : `${avaliacoes} avaliações, acima da média de ${mediaTop3} dos 3 primeiros`;
    return `${nome} tem ${notaTexto}★ com ${volume}, mas aparece em ${rotuloPosicao(posicao)} na busca por "${posicaoBusca(args)}". O que falta é visibilidade, não reputação.`;
  }

  // 5. Sem nota: não dá para falar de reputação.
  return `${nome} ainda não tem nota no Google. Sem avaliações publicadas, quem pesquisa não tem como comparar seu negócio com os ${mediaTop3 > 0 ? `${mediaTop3} avaliações de média dos 3 primeiros` : "concorrentes da cidade"}.`;
}

/** A busca usada para comparar, quando houver; sem isso a frase não cita termo. */
function posicaoBusca(args: { buscaUsada?: string }): string {
  return args.buscaUsada?.trim() || "a sua cidade";
}

/** Explicação curta do critério, comparando com o Top 3 quando houver base. */
export function explicacaoCurta(c: SimCriterion, r: SimReport): string {
  switch (c.criterio) {
    case "Quantidade de avaliações":
      return r.buscaUsada
        ? `${r.avaliacoes} avaliações contra a média de ${r.mediaTop3} dos 3 primeiros da cidade.`
        : `${r.avaliacoes} avaliações publicadas e nenhum concorrente comparável na cidade.`;
    case "Nota em estrelas":
      return `Nota ${formatarNota(r.nota)}★ frente à meta de conversão local de 4,7★.`;
    case "Site próprio":
      return r.temSite
        ? "Site próprio cadastrado no perfil."
        : r.site
          ? "O perfil leva para uma rede social em vez de um site próprio."
          : "Nenhum site cadastrado no perfil.";
    case "Fotos e horários":
      return `${r.fotos} ${r.fotos === 1 ? "foto" : "fotos"} publicadas (o recomendado são 10 ou mais) e ${
        r.temHorarios ? "horários de funcionamento publicados" : "nenhum horário publicado"
      }.`;
    case "Presença nas respostas de IA":
      return r.camposBasicosFaltando.length === 0
        ? "Dados básicos ok (site, horário, telefone, categoria, fotos). Falta reforçar descrição, serviços e avaliações com palavras-chave para o ChatGPT e o Gemini citarem sua empresa."
        : `${faltamPalavra(r.camposBasicosFaltando.length)} ${r.camposBasicosFaltando.join(", ")} para a IA conseguir descrever seu negócio.`;
    default:
      return c.situacao;
  }
}

export function buildReport(args: {
  alvo: PlaceLike;
  busca: PlaceLike[];
  posicao: number | null;
  buscaUsada?: string;
}): SimReport {
  const { alvo, busca, posicao } = args;
  const buscaUsada = args.buscaUsada?.trim() ?? "";

  const nome = alvo.displayName?.text?.trim() || "Perfil sem nome no Google";
  const endereco = alvo.formattedAddress?.trim() ?? "";
  const cidade = extrairCidade(endereco);
  // Nota do perfil: categoria genérica (Serviços) conta como ausente.
  const categoria = categoriaDoPerfil(alvo);

  const nota = typeof alvo.rating === "number" ? alvo.rating : null;
  const avaliacoes = alvo.userRatingCount ?? 0;

  const concorrentes = busca.filter((p) => p.id !== alvo.id);
  const top3 = concorrentesDaBusca(alvo, busca);
  const mediaTop3 = mediaAvaliacoes(busca.slice(0, 3));

  // Só existe comparação se houver outro negócio na lista além do próprio perfil:
  // sem isso, posição e volume de avaliações não podem ser avaliados.
  const buscaEfetiva = concorrentes.length > 0 ? buscaUsada : "";
  const semComparavel = buscaEfetiva.length === 0;

  const fotos = alvo.photos?.length ?? 0;
  const site = alvo.websiteUri?.trim() || null;
  const social = ehRedeSocial(site ?? undefined);
  const temSite = site !== null && !social;
  const temHorarios = (alvo.regularOpeningHours?.periods?.length ?? 0) > 0;
  const temTelefone = Boolean(alvo.nationalPhoneNumber?.trim());
  const temCategoria = categoria.length > 0;

  const basicos = [
    { nome: "site", cheio: temSite },
    { nome: "horário", cheio: temHorarios },
    { nome: "telefone", cheio: temTelefone },
    { nome: "categoria", cheio: temCategoria },
    { nome: "fotos", cheio: fotos >= 5 },
  ];
  const camposBasicosFaltando = basicos.filter((c) => !c.cheio).map((c) => c.nome);
  const cheios = basicos.length - camposBasicosFaltando.length;

  const criterios: SimCriterion[] = [];
  let indice = 0;

  // 1. Posição na busca local — pontua aqui e aparece na métrica de topo,
  // não na tabela: o roteiro pede 5 critérios na tabela e a colocação no card.
  const ptsPosicao = semComparavel ? 0
    : posicao !== null && posicao <= 3 ? PESOS.posicao
    : posicao !== null ? Math.round(PESOS.posicao * 0.6)
    : 0;
  indice += ptsPosicao;

  // 2. Volume de avaliações frente aos 3 primeiros
  const razao = mediaTop3 > 0 ? avaliacoes / mediaTop3 : avaliacoes > 0 ? 2 : 0;
  const ptsAvaliacoes = semComparavel ? 0 : razao >= 1 ? PESOS.avaliacoes
    : razao >= 0.6 ? Math.round(PESOS.avaliacoes * 0.8)
    : razao >= 0.3 ? Math.round(PESOS.avaliacoes * 0.45)
    : razao > 0 ? Math.round(PESOS.avaliacoes * 0.2)
    : 0;
  indice += ptsAvaliacoes;
  criterios.push({
    criterio: "Quantidade de avaliações",
    prioridade: 1,
    situacao: semComparavel
      ? "Sem concorrentes comparáveis na cidade — não deu para avaliar a quantidade de avaliações"
      : `${avaliacoes} avaliações — média dos 3 primeiros na cidade: ${mediaTop3}`,
    status: semComparavel ? "melhorar" : ptsAvaliacoes === PESOS.avaliacoes ? "ok" : ptsAvaliacoes > PESOS.avaliacoes * 0.3 ? "melhorar" : "critico",
  });

  // 3. Nota média
  const ptsNota = nota !== null && nota >= 4.7 ? PESOS.nota
    : nota !== null && nota >= 4.3 ? Math.round(PESOS.nota * 0.7)
    : nota !== null && nota >= 4 ? Math.round(PESOS.nota * 0.35)
    : nota !== null ? Math.round(PESOS.nota * 0.15)
    : 0;
  indice += ptsNota;
  criterios.push({
    criterio: "Nota em estrelas",
    prioridade: 2,
    situacao: `${formatarNota(nota)} ★ — a meta de conversão local é 4,7 ou mais`,
    status: ptsNota === PESOS.nota ? "ok" : ptsNota > PESOS.nota * 0.3 ? "melhorar" : "critico",
  });

  // 4. Site próprio
  const ptsSite = temSite ? PESOS.site : social ? Math.round(PESOS.site * 0.5) : 0;
  indice += ptsSite;
  criterios.push({
    criterio: "Site próprio",
    prioridade: 3,
    situacao: temSite ? site ?? "—" : social ? `No lugar do site: ${site}` : "Nenhum site cadastrado no perfil",
    status: ptsSite === PESOS.site ? "ok" : ptsSite > 0 ? "melhorar" : "critico",
  });

  // 5. Fotos e horários de funcionamento — um critério só, como no roteiro
  const ptsFotos = fotos >= 10 ? PESOS.fotos : fotos > 0 ? Math.round(PESOS.fotos * 0.5) : 0;
  const ptsHorarios = temHorarios ? PESOS.horarios : 0;
  const ptsMidia = ptsFotos + ptsHorarios;
  const totalMidia = PESOS.fotos + PESOS.horarios;
  indice += ptsMidia;
  criterios.push({
    criterio: "Fotos e horários",
    prioridade: 4,
    situacao: `${fotos >= 10
      ? "10 ou mais fotos no perfil (o Google mostra até 10 na leitura pública)"
      : `${fotos} ${fotos === 1 ? "foto" : "fotos"} no perfil — o recomendado são 10 ou mais`} · ${
      temHorarios ? "horários de funcionamento publicados" : "sem horários de funcionamento publicados"}`,
    status: ptsMidia === totalMidia ? "ok" : ptsMidia > 0 ? "melhorar" : "critico",
  });

  // 6. Presença nas respostas de IA — derivado dos campos básicos. Mesmo com
  // tudo preenchido o selo nunca é OK: quem decide a citação é a IA, não nós.
  const ptsIA = Math.round((cheios / basicos.length) * PESOS.ia);
  indice += ptsIA;
  criterios.push({
    criterio: "Presença nas respostas de IA",
    prioridade: 5,
    situacao: camposBasicosFaltando.length === 0
      ? "Dados básicos ok (site, horário, telefone, categoria, fotos). Falta reforçar descrição, serviços e avaliações com palavras-chave para o ChatGPT e o Gemini citarem sua empresa."
      : `${cheios} de ${basicos.length} campos que a IA lê estão preenchidos. ${faltamPalavra(camposBasicosFaltando.length)}: ${camposBasicosFaltando.join(", ")}.`,
    status: camposBasicosFaltando.length === 0 ? "melhorar" : cheios >= 2 ? "melhorar" : "critico",
  });

  criterios.sort((a, b) => a.prioridade - b.prioridade);

  const posicaoStatus: SimStatus = posicao !== null && posicao <= 3 ? "ok"
    : posicao !== null ? "melhorar" : "critico";

  const veredito = vereditoDo({
    nome,
    nota,
    avaliacoes,
    mediaTop3,
    posicao,
    semComparavel,
    buscaUsada: buscaEfetiva,
  });

  const resumo = [
    "Diagnóstico Google Meu Negócio — V2 Digital",
    `Empresa: ${nome}`,
    endereco ? `Endereço: ${endereco}` : "",
    "",
    veredito,
    "",
    `Posição na busca local: ${semComparavel ? "não foi possível comparar com a cidade" : `${rotuloPosicao(posicao)} ("${buscaEfetiva}")`}`,
    `Nota e avaliações: ${formatarNota(nota)} ★ (${avaliacoes} avaliações)${semComparavel ? "" : ` — média dos 3 primeiros: ${mediaTop3}`}`,
    `Nota do perfil: ${indice} / 100`,
    "",
    posicao !== null && posicao <= 3
      ? "Quero o plano para manter minha empresa no Top 3 e receber mais ligações."
      : "Quero o plano para chegar ao Top 3 da minha cidade.",
  ].filter((l) => l !== "").join("\n");

  return {
    nome,
    endereco,
    cidade,
    categoria,
    posicao,
    posicaoRotulo: rotuloPosicao(posicao),
    posicaoStatus,
    buscaUsada: buscaEfetiva,
    nota,
    avaliacoes,
    mediaTop3,
    concorrentes: concorrentes.length,
    top3,
    fotos,
    site,
    temSite,
    temHorarios,
    camposBasicosFaltando,
    indice,
    criterios,
    veredito,
    resumo,
  };
}
