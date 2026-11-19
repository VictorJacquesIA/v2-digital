/*
 * Textos do copiloto: prompts e chamadas ao Gemini. Quem entra na fila e a nota
 * de oportunidade são decididos em copiloto.ts; aqui a IA só escreve.
 * Usado apenas dentro de handlers de createServerFn (servidor).
 */
import { pedirJson, type EsquemaGemini } from "../gemini";
import type { ItemProposta, MetricasSemana } from "./copiloto";

const TOM = `Você escreve em nome do Victor, da V2 Digital, agência de marketing digital de Imbituba/SC para pequenos negócios (Google Meu Negócio, sites e landing pages, tráfego pago, SEO e IA para negócios).
Regras: português do Brasil; tom consultivo, próximo e direto; sem jargão de venda agressivo, sem emojis, sem promessa de resultado garantido; não invente dados que não estão na entrada; não use termos em inglês quando houver palavra em português.`;

const REGRA_WHATS =
  'Cada mensagem de WhatsApp: primeira pessoa ("aqui é o Victor, da V2 Digital" só na primeira abordagem), até 500 caracteres, um ponto concreto sobre o negócio e termina com uma pergunta simples.';

const ESQUEMA_MENSAGENS: EsquemaGemini = {
  type: "OBJECT",
  required: ["mensagens"],
  properties: {
    mensagens: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["id", "mensagem", "justificativa"],
        properties: { id: { type: "STRING" }, mensagem: { type: "STRING" }, justificativa: { type: "STRING" } },
      },
    },
  },
};

export type Mensagem = { id: string; mensagem: string; justificativa: string };

/**
 * O modelo às vezes devolve acentos como %u00e9 ou é (literal) e põe emoji
 * mesmo proibido no prompt: o texto é limpo aqui antes de ir para a fila.
 */
export function limparTexto(t: string | null | undefined): string {
  return (t ?? "")
    .replace(/%u([0-9a-f]{4,5})/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/\\u([0-9a-f]{4})/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}\u{FE0F}\u{200D}]/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/ +([,.!?])/g, "$1")
    .trim();
}

/** Uma chamada ao Gemini para vários contatos: cabe no tempo de uma função do servidor. */
async function lote(instrucoes: string, itens: Array<{ id: string }>): Promise<Mensagem[]> {
  if (!itens.length) return [];
  const r = await pedirJson<{ mensagens: Mensagem[] }>(`${TOM}\n${instrucoes} ${REGRA_WHATS}\nDevolva um item por id recebido.`, JSON.stringify(itens), ESQUEMA_MENSAGENS);
  const ids = new Set(itens.map((i) => i.id));
  return (r.mensagens ?? [])
    .map((m) => ({ id: m.id, mensagem: limparTexto(m.mensagem), justificativa: limparTexto(m.justificativa) }))
    .filter((m) => ids.has(m.id) && m.mensagem);
}

export function mensagensSdr(itens: Array<{ id: string; empresa: string; nicho?: string | null; regiao?: string | null; contato?: string | null; sinais: string[] }>) {
  return lote(
    'Papel: SDR. Escreva a primeira mensagem de WhatsApp para cada empresa, começando por um ponto real do perfil dela no Google (os "sinais") e oferecendo um diagnóstico gratuito do perfil. Em "justificativa", diga em 1 frase por que esta empresa é uma boa oportunidade.',
    itens,
  );
}

export function mensagensFollowup(itens: Array<{ id: string; empresa: string; contato?: string | null; nicho?: string | null; etapa: string; dias_parado: number; servicos_interesse?: string[]; historico: string[] }>) {
  return lote(
    'Papel: assistente de follow-up. Cada contato abaixo parou de responder. Escreva um follow-up de WhatsApp que retome o ponto onde a conversa parou (veja etapa e histórico), traga algo útil ou uma pergunta fácil e não pressione. Em "justificativa", resuma em 1 frase o motivo do follow-up.',
    itens,
  );
}

export async function rascunhoProposta(entrada: Record<string, unknown>): Promise<{ resumo: string; itens: ItemProposta[]; valor_mensal: number; mensagem: string }> {
  const r = await pedirJson<{ resumo: string; itens: ItemProposta[]; valor_mensal: number; mensagem: string }>(
    `${TOM}\nPapel: comercial. Monte o rascunho de escopo de uma proposta para o negócio abaixo, com 1 a 3 serviços da V2 que resolvem os pontos fracos dele (ex.: Gestão do Google Meu Negócio, Placa QR + NFC de avaliações, site ou landing page, tráfego pago, social media, IA para o negócio). Para cada serviço, liste entregáveis concretos e um valor mensal sugerido em reais (número), coerente com pequenos negócios do interior de SC. Se a entrada já tiver valor_mensal maior que zero, use-o como referência do total. "resumo": 2 frases sobre o problema e a solução. "mensagem": texto de WhatsApp apresentando a proposta (${REGRA_WHATS}). É um rascunho para o Victor revisar.`,
    JSON.stringify(entrada),
    {
      type: "OBJECT",
      required: ["resumo", "itens", "valor_mensal", "mensagem"],
      properties: {
        resumo: { type: "STRING" },
        mensagem: { type: "STRING" },
        valor_mensal: { type: "NUMBER" },
        itens: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            required: ["servico", "entregaveis", "valor_mensal"],
            properties: { servico: { type: "STRING" }, entregaveis: { type: "STRING" }, valor_mensal: { type: "NUMBER" } },
          },
        },
      },
    },
  );
  const itens = (r.itens ?? []).slice(0, 3).map((i) => ({ servico: limparTexto(i.servico), entregaveis: limparTexto(i.entregaveis), valor_mensal: Math.max(0, Number(i.valor_mensal) || 0) }));
  const valor_mensal = itens.reduce((s, i) => s + i.valor_mensal, 0) || Math.max(0, Number(r.valor_mensal) || 0);
  return { resumo: limparTexto(r.resumo), itens, valor_mensal, mensagem: limparTexto(r.mensagem) };
}

export async function analiseSemanal(metricas: MetricasSemana): Promise<{ resumo: string; gargalo: string; acoes: string[] }> {
  const r = await pedirJson<{ resumo: string; gargalo: string; acoes: string[] }>(
    `${TOM}\nPapel: analista comercial. Com as métricas da semana abaixo, escreva para o Victor: "resumo" (3 frases objetivas sobre a semana, citando os números), "gargalo" (1 frase sobre onde os leads estão travando) e "acoes" (exatamente 3 ações práticas e priorizadas para esta semana, cada uma em 1 frase começando com verbo). Taxa de resposta nula significa que não houve contatos suficientes para medir. Não invente números.`,
    JSON.stringify(metricas),
    { type: "OBJECT", required: ["resumo", "gargalo", "acoes"], properties: { resumo: { type: "STRING" }, gargalo: { type: "STRING" }, acoes: { type: "ARRAY", items: { type: "STRING" } } } },
  );
  return { resumo: limparTexto(r.resumo), gargalo: limparTexto(r.gargalo), acoes: (r.acoes ?? []).slice(0, 3).map(limparTexto) };
}
