/*
 * Cliente do Gemini (Google AI Studio) com resposta em JSON, usado pela estratégia
 * dos leads e pelo copiloto do CRM. Só é chamado dentro de handlers de createServerFn.
 */

// Reservas quando o modelo principal está sobrecarregado: os "lite" costumam ter folga no plano gratuito.
const MODELOS_RESERVA = ["gemini-3.5-flash-lite", "gemini-flash-lite-latest"];

// Modelo sobrecarregado às vezes demora minutos para responder: desiste antes e tenta o próximo
const LIMITE_POR_MODELO_MS = 30_000;

export class GeminiSobrecarregado extends Error {}
export class GeminiSemChave extends Error {}

/** Esquema no formato do Gemini (OBJECT, STRING, ARRAY...). */
export type EsquemaGemini = Record<string, unknown>;

export const chaveGemini = () => process.env["GEMINI_API_KEY"]?.trim() || null;

/**
 * Gera texto JSON. Em 503/429/500 (sobrecarga ou cota) ou 404 (modelo retirado),
 * tenta o próximo modelo da lista antes de desistir.
 */
export async function gerarJsonGemini(chave: string, instrucoes: string, entrada: string, esquema: EsquemaGemini): Promise<string> {
  const principal = process.env["GEMINI_MODEL"] || "gemini-3.8-flash";
  const modelos = [principal, ...MODELOS_RESERVA.filter((m) => m !== principal)];
  let ultimoErro: Error = new GeminiSobrecarregado("Nenhum modelo do Gemini respondeu.");
  for (const modelo of modelos) {
    try {
      return await chamarGemini(chave, modelo, instrucoes, entrada, esquema);
    } catch (e) {
      const status = (e as { status?: number }).status ?? 0;
      if (![404, 429, 500, 503, 504].includes(status)) throw e;
      console.warn(`Gemini ${modelo} indisponível (${status}), tentando o próximo modelo.`);
      ultimoErro = new GeminiSobrecarregado((e as Error).message);
    }
  }
  throw ultimoErro;
}

/** Atalho: exige a chave e devolve o JSON já interpretado. */
export async function pedirJson<T>(instrucoes: string, entrada: string, esquema: EsquemaGemini): Promise<T> {
  const chave = chaveGemini();
  if (!chave) throw new GeminiSemChave("GEMINI_API_KEY não configurada.");
  return JSON.parse(await gerarJsonGemini(chave, instrucoes, entrada, esquema)) as T;
}

/** Mensagem curta para o painel a partir de um erro do Gemini. */
export function erroDeIa(e: unknown): string {
  if (e instanceof GeminiSemChave) return "A chave do Gemini (GEMINI_API_KEY) não está configurada no servidor.";
  if (e instanceof GeminiSobrecarregado) return "O Gemini está sobrecarregado agora (todos os modelos ocupados). Tente de novo em alguns minutos.";
  return "A IA não conseguiu gerar agora. Tente de novo em instantes.";
}

/**
 * Texto livre, como um cliente perguntaria à IA. Com GEMINI_BUSCA_WEB=1 a IA consulta
 * a web (Google Search), o que exige faturamento ativo na chave; sem isso responde com
 * o que já sabe. Tenta os modelos em ordem e desiste em `limiteMs`.
 */
export async function gerarTextoGemini(chave: string, pergunta: string, limiteMs = 20_000): Promise<{ texto: string; buscaWeb: boolean }> {
  const principal = process.env["GEMINI_MODEL"] || "gemini-3.8-flash";
  const modelos = [principal, ...MODELOS_RESERVA.filter((m) => m !== principal)];
  const buscaWeb = process.env["GEMINI_BUSCA_WEB"] === "1";
  const fim = Date.now() + limiteMs;
  let ultimo: Error = new GeminiSobrecarregado("Nenhum modelo do Gemini respondeu.");
  for (const modelo of modelos) {
    const resta = fim - Date.now();
    if (resta < 2_000) break;
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: "POST",
        signal: AbortSignal.timeout(resta),
        headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: pergunta }] }],
          ...(buscaWeb ? { tools: [{ google_search: {} }] } : {}),
        }),
      });
      if (!r.ok) {
        ultimo = Object.assign(new Error(`Gemini ${modelo} ${r.status}`), { status: r.status });
        if ([404, 429, 500, 503].includes(r.status)) continue;
        throw ultimo;
      }
      const j = (await r.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const texto = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
      if (texto) return { texto, buscaWeb };
    } catch (e) {
      if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) break;
      ultimo = e as Error;
    }
  }
  throw ultimo;
}

async function chamarGemini(chave: string, modelo: string, instrucoes: string, entrada: string, esquema: EsquemaGemini): Promise<string> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    signal: AbortSignal.timeout(LIMITE_POR_MODELO_MS),
    headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instrucoes }] },
      contents: [{ role: "user", parts: [{ text: entrada }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: esquema },
    }),
  }).catch((e: unknown) => {
    // Tempo esgotado conta como sobrecarga (504) para cair no próximo modelo
    if (e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError")) throw Object.assign(new Error(`Gemini ${modelo} sem resposta em ${LIMITE_POR_MODELO_MS / 1000}s`), { status: 504 });
    throw e;
  });
  if (!r.ok) {
    throw Object.assign(new Error(`Gemini ${modelo} ${r.status}: ${(await r.text()).slice(0, 300)}`), { status: r.status });
  }
  const j = (await r.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}
