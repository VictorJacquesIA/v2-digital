import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { expiracaoDe } from "./estrategia-link";

export type Estrategia = { raioX: string; mapa: string; ia: string; plano: string; geradaEm: string };
export type ResultadoEstrategia = { ok: true; estrategia: Estrategia; token: string; expira: string } | { ok: false; erro: string };

// Gemini gratuito (Google AI Studio) quando GEMINI_API_KEY existe — funciona fora do Lovable (ex.: Vercel).
async function gerarComGemini(chave: string, input: string): Promise<string> {
  const modelo = process.env["GEMINI_MODEL"] || "gemini-3.8-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: INSTRUCOES }] },
      contents: [{ role: "user", parts: [{ text: input }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          required: ["raioX", "mapa", "ia", "plano"],
          properties: { raioX: { type: "STRING" }, mapa: { type: "STRING" }, ia: { type: "STRING" }, plano: { type: "STRING" } },
        },
      },
    }),
  });
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = (await r.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

async function gerarComGateway(input: string): Promise<string> {
  const resp = await generateResponse({
    model: "openai/gpt-6-astra",
    instructions: INSTRUCOES,
    input,
    text: { format: { type: "json_schema", name: "estrategia", strict: true, schema: ESQUEMA } },
  });
  const r = resp as unknown as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  return r.output_text ?? (r.output ?? []).flatMap((o) => o.content ?? []).filter((c) => c.type === "output_text").map((c) => c.text ?? "").join("");
}

function novoToken() {
  const b = new Uint8Array(18);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

const ESQUEMA = {
  type: "object",
  additionalProperties: false,
  required: ["raioX", "mapa", "ia", "plano"],
  properties: {
    raioX: { type: "string" },
    mapa: { type: "string" },
    ia: { type: "string" },
    plano: { type: "string" },
  },
} as const;

const INSTRUCOES = `Você é estrategista sênior da V2 Digital, agência de marketing local em Imbituba, SC.
Escreva em português do Brasil, direto, sem jargão, frases curtas, pronto para colar no WhatsApp do cliente ou usar em reunião.
Use só os dados fornecidos; não invente números, avaliações ou concorrentes. Nunca prometa ou garanta posição no Google.
Evite as palavras: plaquinha, cerco, domínio total, garantido, algoritmo.
Devolva 4 blocos em texto simples (use "- " para itens, sem markdown de títulos):
raioX: o que os dados do Google revelam hoje (categoria, nota, avaliações, site, fotos, horários, posição e comparação com o Top 3).
mapa: otimizações práticas de categorias, palavras-chave, fotos e avaliações para buscar o Top 3 do mapa.
ia: o que ajustar em dados estruturados, site e perfil para ChatGPT e Gemini recomendarem o negócio.
plano: o que a V2 vai fazer na prática, em etapas de 30/60/90 dias, para gerar mais mensagens no WhatsApp.`;

export const gerarEstrategia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { leadId: string }) => ({ leadId: String(d?.leadId ?? "") }))
  .handler(async ({ data, context }): Promise<ResultadoEstrategia> => {
    const { data: admin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!admin) return { ok: false, erro: "Sem permissão." };

    const { data: lead, error } = await context.supabase
      .from("leads_diagnostico")
      .select("business_name, maps_url, indice, posicao, dados")
      .eq("id", data.leadId)
      .maybeSingle();
    if (error || !lead) return { ok: false, erro: "Contato não encontrado." };
    if (!lead.dados) {
      return { ok: false, erro: "Este contato não tem dados do Google salvos (diagnóstico antigo ou incompleto)." };
    }

    const input = `Dados do negócio vindos do Google Places:\n${JSON.stringify({ negocio: lead.business_name, link: lead.maps_url, ...(lead.dados as object) })}`;
    try {
      const gemini = process.env["GEMINI_API_KEY"];
      const texto = gemini ? await gerarComGemini(gemini, input) : await gerarComGateway(input);
      const p = JSON.parse(texto) as Omit<Estrategia, "geradaEm">;
      const agora = new Date();
      const estrategia: Estrategia = { raioX: p.raioX, mapa: p.mapa, ia: p.ia, plano: p.plano, geradaEm: agora.toISOString() };
      const token = novoToken();
      const expira = expiracaoDe(agora).toISOString();
      const { error: e2 } = await context.supabase
        .from("leads_diagnostico")
        .update({ estrategia: estrategia as never, estrategia_token: token, estrategia_expira: expira })
        .eq("id", data.leadId);
      if (e2) return { ok: false, erro: "Não foi possível salvar a estratégia." };
      return { ok: true, estrategia, token, expira };
    } catch (e) {
      console.error("Falha ao gerar estratégia:", e);
      if (e instanceof GatewayError && e.code === "payment_required") {
        return { ok: false, erro: "Os créditos de IA acabaram. Configure a chave gratuita do Gemini para continuar." };
      }
      return { ok: false, erro: "A IA não conseguiu gerar agora. Tente de novo em instantes." };
    }
  });

export type EstrategiaPublica = { nome: string; estrategia: Estrategia | null; expira: string | null; expirada: boolean } | null;

export const lerEstrategiaPublica = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => ({ token: String(d?.token ?? "").slice(0, 100) }))
  .handler(async ({ data }): Promise<EstrategiaPublica> => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const sb = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: rows, error } = await sb.rpc("estrategia_publica", { _token: data.token });
    if (error) { console.error(error); return null; }
    const r = (rows as Array<{ business_name: string | null; estrategia: unknown; expira: string | null; expirada: boolean }> | null)?.[0];
    if (!r) return null;
    return { nome: r.business_name || "Seu negócio", estrategia: (r.estrategia as Estrategia) ?? null, expira: r.expira, expirada: !!r.expirada };
  });
