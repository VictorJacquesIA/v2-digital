/*
 * Copy da landing page da V2 Digital.
 *
 * Tudo aqui é texto aprovado ou derivado direto do roteiro do cliente. Nada de
 * número inventado: o que não tem dado real fica de fora do arquivo (ver PROVA).
 */

export const HERO = {
  eyebrow: "Google Meu Negócio + Busca por IA · Imbituba e região",
  titulo: "Seja a primeira empresa que o Google e a IA recomendam na sua cidade.",
  subtitulo:
    "A V2 otimiza seu Google Meu Negócio e prepara sua empresa para ser citada no ChatGPT e no Gemini. O resultado é mais ligações, mais mensagens no WhatsApp e mais rotas até o seu balcão, sem depender só de anúncio.",
  acaoPrincipal: "Ver quem está na minha frente (grátis)",
  acaoSecundaria: "Prefiro falar no WhatsApp",
  confianca: [
    "Diagnóstico em 60 segundos",
    "Sem compromisso",
    "Feito para negócios locais",
  ],
} as const;

export const AUDITORIA = {
  eyebrow: "Diagnóstico gratuito",
  titulo:
    "Cole o link da sua empresa. Em segundos, veja quem está levando os clientes que deveriam ser seus.",
  apoio:
    "Você recebe sua posição no ranking, sua nota frente aos 3 primeiros colocados, o que a IA responde sobre o seu negócio e as falhas que estão custando clientes.",
  botao: "Mostrar meu diagnóstico",
} as const;

export const PROBLEMA = {
  titulo: "Quem não está no Top 3 não perde posição. Perde cliente.",
  texto:
    'O cliente não abre mais a lista telefônica. Ele pesquisa no Google, olha o site, lê as avaliações e vai atrás de um dos três primeiros. Hoje também pergunta ao ChatGPT e ao Gemini "qual o melhor [serviço] em [cidade]". Se você não aparece nas duas respostas, não é falta de movimento: é um concorrente ocupando o lugar que seria seu.',
  cards: [
    {
      titulo: "Você some no mapa.",
      texto: "Fora do Top 3, quase ninguém rola a lista.",
    },
    {
      titulo: "Você some na IA.",
      texto:
        "Sem informações bem estruturadas, o ChatGPT pode nem saber que você existe.",
    },
    {
      titulo: "Você parece menor.",
      texto:
        "Poucas avaliações e perfil abandonado passam imagem de empresa fraca, mesmo quando você é a melhor.",
    },
  ],
} as const;

export const METODO = {
  eyebrow: "Como a V2 trabalha",
  titulo: "Quatro frentes, um objetivo: mais presença no Google.",
  passos: [
    {
      n: "01",
      nome: "Diagnóstico",
      texto: "Mostramos onde você perde clientes e para quem.",
    },
    {
      n: "02",
      nome: "Mapa",
      texto:
        "Reestruturamos seu perfil: categorias, serviços, fotos, posts e perguntas.",
    },
    {
      n: "03",
      nome: "IA",
      texto:
        "Organizamos suas informações para ChatGPT, Gemini e Copilot passarem a te citar.",
    },
    {
      n: "04",
      nome: "Prova",
      texto: "Fluxo de avaliações 5 estrelas no balcão.",
    },
  ],
} as const;

/ Prazo da meta e reversão de risco — valores que o cliente definiu. */
export const OFERTA = {
  nome: "Presença Local V2",
  eyebrow: "Oferta principal",
  titulo:
    "Google Meu Negócio + Visibilidade em IA, gerenciados por quem faz isso todo dia.",
  entregas: [
    "Perfil otimizado para o mapa.",
    "Dados organizados para respostas de IA.",
    "Estratégia ativa de avaliações 5 estrelas.",
    "Relatório mensal focado em ligações, mensagens e rotas.",
  ],
  metaDias: 90,
  confianca:
    "Meta de Top 3 no mapa em até 90 dias, com relatório mensal mostrando cada avanço.",
  botao: "Quero minha proposta",
} as const;

export const COMPLEMENTOS = {
  titulo: "Acelere o resultado.",
  botao: "Quero incluir",
  cards: [
    {
      n: "01",
      nome: "Placa QR + NFC de Avaliação",
      texto:
        "Chega pronta na sua loja; o cliente aponta o celular ou encosta no NFC e avalia em 5 segundos.",
    },
    {
      n: "02",
      nome: "Tráfego Pago Local",
      texto:
        "Anúncios no Google e Instagram só para quem está na sua cidade e pronto para comprar.",
    },
    {
      n: "03",
      nome: "Site ou Landing Page de Venda",
      texto: "Página rápida que leva o clique direto ao seu WhatsApp.",
    },
  ],
} as const;

/**
 * Prova social. Só entra o que existe de verdade: as logos reais enviadas pelo
 * cliente. Cards de resultado, depoimento e a linha de "empresas atendidas"
 * estão com os campos vazios no roteiro, então continuam fora do ar.
 */
export const PROVA = {
  titulo: "Alguns de nossos clientes.",
  resultados: [] as {
    cliente: string;
    posicaoAntes: string;
    posicaoDepois: string;
    dias: string;
    ligacoes: string;
  }[],
  depoimento: null as string | null,
  totalAtendidas: null as number | null,
} as const;

export const FAQ = [
  {
    pergunta: "Vocês garantem o Top 3?",
    resposta:
      "Ninguém pode garantir posição, porque o Google decide. O que entregamos é método, meta com prazo e relatório mensal mostrando cada avanço.",
  },
  {
    pergunta: "Funciona para o meu tipo de negócio?",
    resposta:
      "Funciona para qualquer negócio que atenda gente da região: clínica, loja, restaurante, corretor, prestador de serviço.",
  },
  {
    pergunta: "Preciso investir em anúncio?",
    resposta: "Não. O trabalho principal é orgânico; o anúncio só acelera.",
  },
  {
    pergunta: "Meu perfil é novo ou está abandonado. Dá para recuperar?",
    resposta: "Dá, e muitas vezes é onde o ganho é maior.",
  },
] as const;

/ Título da seção de dúvidas — traz a cidade, como o roteiro pede nos H2. */
export const FAQ_TITULO = "Perguntas de quem tem negócio em Imbituba e região";

export const CTA_FINAL = {
  titulo: "Fale com a V2 e receba uma proposta para o seu negócio.",
  apoio: "Preenche os três campos e a conversa já abre no seu WhatsApp.",
  botao: "Chamar a V2 no WhatsApp",
  abaixo: "Sem reunião longa e sem compromisso.",
} as const;

/ Textos da tela de resultado da auditoria. */
export const RESULTADO = {
  eyebrow: "Diagnóstico real · Google Meu Negócio",
  posicaoFrase: "Quem está fora do Top 3 recebe a menor parte das ligações.",
  concorrentesTitulo: "Quem está na sua frente",
  pesaTitulo: "O que mais pesa",
  criteriosTitulo: "Como está cada critério do seu perfil",
  leadChamada: "Enviar o plano completo em PDF para o meu WhatsApp",
  prefiro: "Prefiro falar no WhatsApp",
  confianca: "Plano em até 24h · Sem compromisso · Usamos só dados públicos do seu perfil.",
} as const;

/ Todos os H2 da página, na ordem em que aparecem. */
export const H2S = [
  AUDITORIA.titulo,
  PROBLEMA.titulo,
  METODO.titulo,
  OFERTA.titulo,
  COMPLEMENTOS.titulo,
  PROVA.titulo,
  FAQ_TITULO,
  CTA_FINAL.titulo,
] as const;

/ Todos os textos fixos da página, para o teste de palavras proibidas. */
export function textosDaPagina(): string[] {
  return [
    HERO.eyebrow,
    HERO.titulo,
    HERO.subtitulo,
    HERO.acaoPrincipal,
    HERO.acaoSecundaria,
    ...HERO.confianca,
    AUDITORIA.eyebrow,
    AUDITORIA.titulo,
    AUDITORIA.apoio,
    AUDITORIA.botao,
    PROBLEMA.titulo,
    PROBLEMA.texto,
    ...PROBLEMA.cards.flatMap((c) => [c.titulo, c.texto]),
    METODO.eyebrow,
    METODO.titulo,
    ...METODO.passos.flatMap((p) => [p.nome, p.texto]),
    OFERTA.nome,
    OFERTA.eyebrow,
    OFERTA.titulo,
    ...OFERTA.entregas,
    OFERTA.confianca,
    OFERTA.botao,
    COMPLEMENTOS.titulo,
    COMPLEMENTOS.botao,
    ...COMPLEMENTOS.cards.flatMap((c) => [c.nome, c.texto]),
    PROVA.titulo,
    FAQ_TITULO,
    ...FAQ.flatMap((f) => [f.pergunta, f.resposta]),
    CTA_FINAL.titulo,
    CTA_FINAL.apoio,
    CTA_FINAL.botao,
    CTA_FINAL.abaixo,
    RESULTADO.eyebrow,
    RESULTADO.posicaoFrase,
    RESULTADO.concorrentesTitulo,
    RESULTADO.pesaTitulo,
    RESULTADO.criteriosTitulo,
    RESULTADO.leadChamada,
    RESULTADO.prefiro,
    RESULTADO.confianca,
  ];
}
