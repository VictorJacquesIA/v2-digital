/*
 * Checagens extras do diagnóstico (Pacote 2), só no servidor:
 * - teste real na IA: pergunta ao Gemini o que um cliente perguntaria e vê se a empresa aparece;
 * - checagem do site: segurança, celular, telefone igual ao do Google, dados para IAs e velocidade.
 * Nada aqui pode travar o diagnóstico: qualquer falha devolve null e o bloco some do relatório.
 */
import { chaveGemini, gerarTextoGemini } from "./gemini";
import type { SimIa, SimSite } from "./simulador-score";

/** Minúsculas, sem acento e sem pontuação, para comparar nomes. */
export function normalizar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PALAVRAS_SOLTAS = new Set(["ltda", "me", "eireli", "epp", "sa", "de", "da", "do", "das", "dos", "e", "a", "o"]);

/**
 * A resposta cita a empresa? Vale o nome completo ou, para nomes longos, o trecho antes
 * de " - " ou " | " (o Google costuma juntar cidade ou slogan ao nome).
 */
export function citaEmpresa(resposta: string, nome: string): boolean {
  const r = ` ${normalizar(resposta)} `;
  const candidatos = new Set<string>();
  candidatos.add(normalizar(nome));
  const base = nome.split(/\s[-|–]\s|\s\|\s/)[0] ?? nome;
  candidatos.add(normalizar(base));
  for (const c of candidatos) {
    const palavras = c.split(" ").filter((p) => p && !PALAVRAS_SOLTAS.has(p));
    if (palavras.length === 0) continue;
    // Uma palavra só (ex.: "Mazaro") precisa ter 5+ letras para não dar falso positivo.
    if (palavras.length === 1 && palavras[0]!.length < 5) continue;
    if (r.includes(` ${c} `)) return true;
  }
  return false;
}

/** Tira markdown simples para mostrar um trecho limpo da resposta. */
function limparMarkdown(t: string): string {
  return t.replace(/\*\*|__|#+\s|`/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

/** Resposta crua da IA; a comparação com os concorrentes é feita depois das buscas. */
export type RespostaIa = { pergunta: string; buscaWeb: boolean; texto: string };

/** Faz a pergunta que um cliente faria. Roda em paralelo com as buscas do Google. */
export async function perguntarIa(segmento: string, cidade: string): Promise<RespostaIa | null> {
  const chave = chaveGemini();
  if (!chave || !segmento || !cidade) return null;
  const pergunta = `Quais as melhores opções de ${segmento} em ${cidade}? Indique de 3 a 5, com o nome de cada uma.`;
  try {
    const { texto, buscaWeb } = await gerarTextoGemini(chave, pergunta, 15_000);
    return { pergunta, buscaWeb, texto: limparMarkdown(texto) };
  } catch (e) {
    console.warn("Teste na IA não concluiu:", (e as Error).message);
    return null;
  }
}

/** Monta o bloco do relatório: a empresa foi citada? E quais dos 3 primeiros foram? */
export function montarIa(r: RespostaIa, nome: string, concorrentes: string[]): SimIa {
  return {
    pergunta: r.pergunta,
    ia: "Gemini",
    buscaWeb: r.buscaWeb,
    citado: citaEmpresa(r.texto, nome),
    concorrentesCitados: concorrentes.filter((c) => citaEmpresa(r.texto, c)),
    trecho: r.texto.length > 700 ? `${r.texto.slice(0, 700).trimEnd()}…` : r.texto,
  };
}

/** Últimos 8 dígitos do telefone, aceitando separadores no meio (ex.: 99950-7960). */
function telefoneNoHtml(html: string, telefone?: string): boolean | null {
  const d = (telefone ?? "").replace(/\D/g, "");
  if (d.length < 8) return null;
  const fim = d.slice(-8).split("").join("[^0-9]{0,3}");
  return new RegExp(fim).test(html);
}

async function velocidadeNoCelular(url: string): Promise<number | null> {
  const chave = process.env["GOOGLE_PLACES_API_KEY"]?.trim();
  if (!chave) return null;
  try {
    const r = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&key=${chave}`,
      { signal: AbortSignal.timeout(25_000) }, // o PageSpeed leva de 10 a 20 s
    );
    if (!r.ok) return null; // API não ativada na chave ou cota: o relatório só não mostra a velocidade
    const j = (await r.json()) as { lighthouseResult?: { categories?: { performance?: { score?: number } } } };
    const s = j.lighthouseResult?.categories?.performance?.score;
    return typeof s === "number" ? Math.round(s * 100) : null;
  } catch {
    return null;
  }
}

type LeituraSite = { status: number; urlFinal: string; html: string } | null;

/** Baixa a página inteira (cabeçalho e corpo) dentro do próprio limite de tempo. null = não deu para ler. */
async function lerPagina(url: string): Promise<LeituraSite> {
  try {
    const r = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; V2Digital-Diagnostico/1.0)" },
    });
    const html = r.ok ? (await r.text()).slice(0, 1_500_000) : "";
    return { status: r.status, urlFinal: r.url || url, html };
  } catch (e) {
    console.warn(`Checagem do site sem resposta (${url}):`, (e as Error).message);
    return null;
  }
}

export async function checarSite(url: string | null, telefone?: string): Promise<SimSite | null> {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  // Página e velocidade em paralelo, cada uma com seu limite: uma não corta a outra.
  const [pagina, velocidade] = await Promise.all([lerPagina(url), velocidadeNoCelular(url)]);
  // Sem resposta (rede, tempo, bloqueio de robô) não é prova de site fora do ar: o bloco some.
  if (!pagina) return null;
  // Só marca "não abre" quando o próprio site responde com erro.
  if (pagina.status >= 400) {
    return { url, abriu: false, https: url.startsWith("https://"), celular: null, telefone: null, dadosEstruturados: null, velocidade };
  }
  const { html } = pagina;
  return {
    url,
    abriu: true,
    https: pagina.urlFinal.startsWith("https://"),
    celular: /<meta[^>]+name=["']?viewport/i.test(html),
    telefone: telefoneNoHtml(html, telefone),
    dadosEstruturados: /application\/ld\+json/i.test(html),
    velocidade,
  };
}
