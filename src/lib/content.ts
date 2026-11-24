/*
 * Copy da landing page da V2 Digital.
 *
 * Tudo aqui é texto aprovado ou derivado direto do roteiro do cliente. Nada de
 * número inventado: o que não tem dado real fica de fora do arquivo (ver PROVA).
 */

export const HERO = {
  eyebrow: "Google Meu Negócio + Busca por IA",
  titulo: "Seja a primeira empresa que o Google e a IA recomendam na sua cidade.",
  subtitulo:
    "Antes de escolher, seu cliente pergunta ao Google, ao ChatGPT e às outras IAs. A V2 faz a sua empresa ser a resposta: perfil completo, informação certa em todo lugar e mais gente ligando e chamando no WhatsApp, sem depender só de anúncio.",
  acaoPrincipal: "Fazer o diagnóstico rápido grátis",
  acaoSecundaria: "Prefiro falar no WhatsApp",
  confianca: [
    "Diagnóstico em 60 segundos",
    "Sem compromisso",
    "Para empresas de todos os portes",
  ],
} as const;

export const AUDITORIA = {
  eyebrow: "Diagnóstico rápido · grátis",
  titulo:
    "Digite o nome da sua empresa. Em segundos, veja quem está levando os clientes que deveriam ser seus.",
  apoio:
    "Em 60 segundos você tem uma primeira noção de como está o seu perfil no Google: sua posição no ranking, sua nota frente aos 3 primeiros e o que está faltando para a IA entender o seu negócio. A análise completa, a gente faz junto com você.",
  botao: "Mostrar meu diagnóstico",
} as const;

export const PROBLEMA = {
  titulo: "Quem não está no Top 3 não perde posição. Perde cliente.",
  texto:
    'Antes de comprar, o cliente pesquisa. Abre o Google, lê as avaliações e escolhe entre os primeiros. Cada vez mais, ele também pergunta ao ChatGPT e às outras IAs: "qual a melhor clínica perto de mim?". Se a sua empresa não aparece, o cliente vai para quem aparece.',
  cards: [
    {
      titulo: "Você some no Google.",
      texto:
        "Quem procura no Google escolhe entre os primeiros. 59% dos consumidores conferem o Google antes de comprar de uma marca nova.",
    },
    {
      titulo: "Você some na IA.",
      texto:
        "Se as suas informações estão incompletas ou desencontradas, o ChatGPT e as outras IAs recomendam outra empresa.",
    },
    {
      titulo: "Você perde a confiança.",
      texto:
        "Avaliação de clientes é a fonte em que o consumidor mais confia: 68%. Perfil parado e nota baixa afastam, mesmo quando você é o melhor.",
    },
  ],
} as const;

export const METODO = {
  eyebrow: "Como a V2 trabalha",
  titulo: "Quatro frentes, um objetivo: sua empresa escolhida no Google e nas IAs.",
  passos: [
    {
      n: "01",
      nome: "Diagnóstico",
      texto:
        "Análise completa do seu perfil, do seu site e dos concorrentes. Você vê onde está perdendo clientes e para quem.",
    },
    {
      n: "02",
      nome: "Google",
      texto:
        "Deixamos seu perfil completo e ativo: serviços, fotos, posts e respostas às perguntas dos clientes.",
    },
    {
      n: "03",
      nome: "IA",
      texto:
        "Organizamos suas informações para que o ChatGPT e as outras IAs entendam o que você faz e tenham motivos para recomendar você.",
    },
    {
      n: "04",
      nome: "Avaliações",
      texto:
        "Uma rotina simples para seus clientes avaliarem, com placa de QR Code e NFC, e resposta a cada comentário.",
    },
  ],
} as const;

/ Prazo da meta e reversão de risco — valores que o cliente definiu. */
export const OFERTA = {
  nome: "Presença V2",
  eyebrow: "Oferta principal",
  titulo: "Seu perfil no Google criado ou atualizado do jeito certo, mais uma placa para os clientes avaliarem você.",
  entregas: [
    "Perfil do Google criado ou reestruturado: categoria, serviços, descrição, fotos e horários certos.",
    "Informações organizadas para o ChatGPT e as outras IAs entenderem o que você faz.",
    "Placa com QR Code e NFC: o cliente aproxima o celular e avalia em segundos.",
    "Orientação para pedir avaliação a todos os clientes e responder cada uma.",
  ],
  confianca: "No fim, você recebe um relatório com tudo o que foi feito no seu perfil.",
  botao: "Quero minha proposta",
} as const;

export const COMPLEMENTOS = {
  titulo: "Acelere o resultado.",
  botao: "Quero incluir",
  cards: [
    {
      n: "01",
      nome: "Acompanhamento Mensal",
      texto:
        "Posts, fotos novas, resposta às avaliações e relatório mensal com ligações, mensagens e pedidos de rota.",
    },
    {
      n: "02",
      nome: "Tráfego Pago",
      texto:
        "Anúncios no Google e no Instagram para quem está perto de você e pronto para comprar.",
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
      "Ninguém pode garantir posição, porque quem decide é o Google. O que fazemos é deixar seu perfil completo e certo, que é o que o Google e as IAs usam para escolher quem mostrar.",
  },
  {
    pergunta: "Funciona para o meu tipo de negócio?",
    resposta:
      "Funciona para empresas de todos os portes que dependem de ser encontradas: clínicas, lojas, restaurantes, imobiliárias, indústrias, prestadores de serviço.",
  },
  {
    pergunta: "Tem mensalidade?",
    resposta:
      "Não. A reestruturação e a placa são feitas uma vez. Se quiser, o acompanhamento mensal entra à parte.",
  },
  {
    pergunta: "Como funciona a placa?",
    resposta:
      "Ela chega pronta, com QR Code e NFC ligados ao seu perfil. O cliente aponta a câmera ou encosta o celular e cai direto na tela de avaliar.",
  },
  {
    pergunta: "Preciso investir em anúncio?",
    resposta: "Não. O trabalho principal é no seu perfil; o anúncio só acelera.",
  },
  {
    pergunta: "Meu perfil é novo ou está abandonado. Dá para recuperar?",
    resposta: "Dá, e muitas vezes é onde o ganho é maior.",
  },
] as const;

/ Título da seção de dúvidas. */
export const FAQ_TITULO = "Perguntas frequentes";

export const CTA_FINAL = {
  titulo: "Escolha como quer começar.",
  caminhos: [
    {
      id: "diagnostico",
      rotulo: "Ainda não sabe por onde começar?",
      texto: "Veja em 60 segundos como está o seu perfil no Google.",
      botao: "Fazer o diagnóstico rápido grátis",
    },
    {
      id: "proposta",
      rotulo: "Já sabe o que quer?",
      texto: "Mande os serviços que você escolheu e receba sua proposta.",
      botao: "Enviar minha proposta no WhatsApp",
    },
  ],
  semItens: "Olá! Vim pelo site da V2 Digital e quero uma proposta.",
  abaixo: "Sem reunião longa e sem compromisso.",
} as const;

/ Textos da tela de resultado da auditoria. */
export const RESULTADO = {
  eyebrow: "Diagnóstico rápido · Google Meu Negócio",
  posicaoFrase: "Quem está fora do Top 3 recebe a menor parte das ligações.",
  concorrentesTitulo: "Quem está na sua frente",
  pesaTitulo: "O que mais pesa",
  criteriosTitulo: "Como está cada critério do seu perfil",
  leadChamada: "Quer um plano para melhorar isso?",
  botao: "Pedir plano no WhatsApp",
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
    ...CTA_FINAL.caminhos.flatMap((c) => [c.rotulo, c.texto, c.botao]),
    CTA_FINAL.abaixo,
    RESULTADO.eyebrow,
    RESULTADO.posicaoFrase,
    RESULTADO.concorrentesTitulo,
    RESULTADO.pesaTitulo,
    RESULTADO.criteriosTitulo,
    RESULTADO.leadChamada,
    RESULTADO.botao,
    RESULTADO.confianca,
  ];
}
