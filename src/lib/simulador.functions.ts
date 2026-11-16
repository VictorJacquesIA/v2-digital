import { createServerFn } from "@tanstack/react-start";
import { buildReport, mesmoSegmento, segmentoDoNegocio, extrairCidade, type PlaceLike, type SimReport } from "./simulador-score";
import { CAPTURA_FALHOU, capturarWhatsApp, WHATSAPP_INVALIDO, whatsappValido, abreNovoCiclo } from "./lead";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

const CAMPOS = [
  "id",
  "displayName",
  "formattedAddress",
  "rating",
  "userRatingCount",
  "websiteUri",
  "nationalPhoneNumber",
  "primaryTypeDisplayName",
  "primaryType",
  "types",
  "photos",
  "regularOpeningHours",
].join(",");
const MASK_LISTA = CAMPOS.split(",").map((c) => `places.${c}`).join(",");

export type SimResultado =
  | { ok: true; relatorio: SimReport }
  | { ok: false; erro: string };

/* ------------------------------------------------------------------ */
/* Chamadas ao Google                                                  */
/*                                                                     */
/* Com a chave do cliente (GOOGLE_PLACES_API_KEY) salva em Secrets, a   */
/* chamada vai direto para a Places API. Sem ela, usa a conexão do      */
/* Google Maps já ligada ao site, pelo gateway.                        */
/* ------------------------------------------------------------------ */

const PLACES = "https://places.googleapis.com";

async function google(
  path: string,
  method: "GET" | "POST",
  mask: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const minhaChave = process.env["GOOGLE_PLACES_API_KEY"]?.trim();
  const chaveConexao = process.env["GOOGLE_MAPS_API_KEY"]?.trim();
  const token = process.env["LOVABLE_API_KEY"]?.trim();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Goog-FieldMask": mask,
  };
  let url: string;

  if (minhaChave) {
    url = `${PLACES}${path}`;
    headers["X-Goog-Api-Key"] = minhaChave;
  } else if (chaveConexao && token) {
    url = `${GATEWAY}/places${path}`;
    headers["Authorization"] = `Bearer ${token}`;
    headers["X-Connection-Api-Key"] = chaveConexao;
  } else {
    throw new Error("A consulta ao Google ainda não está configurada neste site.");
  }

  const resposta = await fetch(url, {
    method,
    headers,
    body: body === undefined ? null : JSON.stringify(body),
  });

  if (resposta.status === 403 && minhaChave) {
    const detalhes: Array<{ reason?: string }> = (await resposta.json().catch(() => null))?.error?.details ?? [];
    const motivo = detalhes.find((d) => d.reason)?.reason;
    if (motivo === "API_KEY_HTTP_REFERRER_BLOCKED") {
      throw new Error("Sua chave do Google está limitada por site. Em Google Cloud Console, deixe as restrições de aplicação da chave como \"Nenhuma\" ou por IP.");
    }
    if (motivo === "API_KEY_SERVICE_BLOCKED") {
      throw new Error("Sua chave do Google não libera a Places API. Em Google Cloud Console, adicione \"Places API (New)\" às APIs permitidas da chave.");
    }
    throw new Error("A sua chave do Google foi recusada (403). Confira as restrições e as APIs liberadas dela em Google Cloud Console.");
  }

  if (!resposta.ok) {
    const texto = await resposta.text();
    console.error(`Google Places falhou [${resposta.status}]: ${texto.slice(0, 400)}`);
    throw new Error(`O Google respondeu com erro (${resposta.status}).`);
  }
  return (await resposta.json()) as Record<string, unknown>;
}

function listar(json: Record<string, unknown>): PlaceLike[] {
  const places = json["places"];
  return Array.isArray(places) ? (places as PlaceLike[]) : [];
}

/* ------------------------------------------------------------------ */
/* Link curto e extração do que a URL traz                             */
/* ------------------------------------------------------------------ */

const LINK_CURTO = /(?:maps\.app\.goo\.gl|goo\.gl\/maps|g\.oo\.gl)\//i;

async function resolverLink(url: string): Promise<string> {
  if (!LINK_CURTO.test(url)) return url;
  try {
    const r = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; V2Digital/1.0)" },
    });
    return r.url || url;
  } catch {
    return url;
  }
}

function placeIdDaUrl(url: string): string | null {
  const padrao = /query_place_id=([A-Za-z0-9_-]{10,})|!1s(Ch[A-Za-z0-9_-]{10,})/;
  const m = padrao.exec(url);
  return m?.[1] ?? m?.[2] ?? null;
}

function coordenadasDaUrl(url: string): { latitude: number; longitude: number } | null {
  const m = /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/.exec(url) ?? /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/.exec(url);
  const lat = m?.[1] ? Number(m[1]) : Number.NaN;
  const lng = m?.[2] ? Number(m[2]) : Number.NaN;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { latitude: lat, longitude: lng } : null;
}

function nomeDaUrl(url: string): string | null {
  const m = /\/place\/([^/?]+)/.exec(url);
  if (!m || !m[1]) return null;
  try {
    return decodeURIComponent(m[1].replace(/\+/g, " "));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Cache curto: o mesmo link não consulta o Google duas vezes          */
/* ------------------------------------------------------------------ */

const TTL = 10 * 60 * 1000;
/** Por quanto tempo o diagnóstico de um negócio fica fixo. */
const FIXO_MS = 7 * 24 * 60 * 60 * 1000;
const MAX = 50;
const cache = new Map<string, { em: number; valor: SimResultado }>();

function lerCache(chave: string): SimResultado | undefined {
  const item = cache.get(chave);
  if (!item) return undefined;
  if (Date.now() - item.em > TTL) {
    cache.delete(chave);
    return undefined;
  }
  return item.valor;
}

function gravarCache(chave: string, valor: SimResultado) {
  if (cache.size >= MAX) {
    const maisAntiga = cache.keys().next().value;
    if (maisAntiga !== undefined) cache.delete(maisAntiga);
  }
  cache.set(chave, { em: Date.now(), valor });
}

/* ------------------------------------------------------------------ */
/* Função de servidor                                                  */
/* ------------------------------------------------------------------ */

/** Completa a linha do contato com o resultado da análise (nota, posição, resumo). */
async function completarLead(leadId: string, relatorio: SimReport, businessName: string, placeId?: string) {
  if (!/^[0-9a-f-]{36}$/i.test(leadId)) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("leads_diagnostico")
      .update({
        business_name: relatorio.nome || businessName || null,
        indice: relatorio.indice,
        posicao: relatorio.posicaoRotulo,
        resumo: relatorio.resumo,
        dados: relatorio as never,
        ...(placeId ? { place_id: placeId } : {}),
      })
      .eq("id", leadId);
    if (error) console.error(`Falha ao completar lead ${leadId}: ${error.message}`);
  } catch (erro) {
    console.error(`Falha ao completar lead ${leadId}:`, erro);
  }
}

export const analisarPerfil = createServerFn({ method: "POST" })
  .inputValidator((data: { mapsUrl?: string; businessName?: string; whatsapp?: string }) => ({
    mapsUrl: String(data?.mapsUrl ?? "").trim(),
    businessName: String(data?.businessName ?? "").trim(),
    whatsapp: String(data?.whatsapp ?? "").trim(),
  }))
  .handler(async ({ data }): Promise<SimResultado> => {
    const { mapsUrl, businessName, whatsapp } = data;

    // O diagnóstico só roda depois que o contato fica gravado para a V2.
    // A gravação acontece no servidor: o visitante não tem permissão de
    // leitura na tabela, então o navegador não consegue confirmar a linha.
    if (!whatsappValido(whatsapp)) {
      return { ok: false, erro: WHATSAPP_INVALIDO };
    }
    let leadId = "";
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const lead = await capturarWhatsApp<{ id: string }>(whatsapp, async (bruto) => {
        // Anti-spam: o mesmo WhatsApp vira uma linha só, com contador de pedidos.
        // Depois de 7 dias sem contato, o lead volta para "novo" (novo ciclo).
        const numero = bruto.replace(/\D/g, "");
        const { data: existente } = await supabaseAdmin
          .from("leads_diagnostico")
          .select("id, interacoes, ultima_interacao, status")
          .eq("whatsapp", numero)
          .order("ultima_interacao", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existente) {
          const novoCiclo = abreNovoCiclo(existente.ultima_interacao);
          return supabaseAdmin
            .from("leads_diagnostico")
            .update({
              interacoes: existente.interacoes + 1,
              ultima_interacao: new Date().toISOString(),
              maps_url: mapsUrl || null,
              ...(businessName ? { business_name: businessName } : {}),
              ...(novoCiclo && existente.status !== "cliente" ? { status: "novo", atendido: false } : {}),
            })
            .eq("id", existente.id)
            .select("id")
            .single();
        }
        return supabaseAdmin
          .from("leads_diagnostico")
          .insert({ whatsapp: numero, maps_url: mapsUrl || null, business_name: businessName || null })
          .select("id")
          .single();
      });
      leadId = lead.id;
    } catch (erro) {
      console.error("Falha ao gravar o contato do diagnóstico:", erro);
      return { ok: false, erro: CAPTURA_FALHOU };
    }

    if (!mapsUrl) {
      return { ok: false, erro: "Cole o link do seu perfil no Google Maps para a gente analisar." };
    }
    if (!/^https?:\/\//i.test(mapsUrl) && !LINK_CURTO.test(mapsUrl)) {
      return { ok: false, erro: "Isso não parece um link do Google Maps. Cole o endereço que começa com https://." };
    }

    const chaveCache = `${mapsUrl}|${businessName}`;
    const guardado = lerCache(chaveCache);
    if (guardado) {
      if (guardado.ok) await completarLead(leadId, guardado.relatorio, businessName);
      return guardado;
    }

    try {
      const urlFinal = await resolverLink(mapsUrl);
      const placeId = placeIdDaUrl(urlFinal);
      const coords = coordenadasDaUrl(urlFinal);
      const nomeNaUrl = nomeDaUrl(urlFinal);

      // 1. Achar o negócio do cliente
      let alvo: PlaceLike | null = null;

      if (placeId) {
        const json = await google(`/v1/places/${placeId}?languageCode=pt-BR`, "GET", CAMPOS);
        alvo = (json["id"] ? json : null) as PlaceLike | null;
      }

      if (!alvo) {
        const cidadeNaUrl = extrairCidade(nomeNaUrl ?? "");
        const consulta = [businessName || nomeNaUrl, cidadeNaUrl].filter(Boolean).join(" em ");
        if (consulta) {
          const json = await google("/v1/places:searchText", "POST", MASK_LISTA, {
            textQuery: consulta,
            maxResultCount: 5,
            languageCode: "pt-BR",
          });
          alvo = listar(json)[0] ?? null;
        }
      }

      if (!alvo && coords) {
        const json = await google("/v1/places:searchNearby", "POST", MASK_LISTA, {
          locationRestriction: { circle: { center: coords, radius: 200 } },
          maxResultCount: 3,
          languageCode: "pt-BR",
        });
        alvo = listar(json)[0] ?? null;
      }

      if (!alvo) {
        return {
          ok: false,
          erro: "Não encontramos esse negócio no Google. Confira o link ou escreva o nome do negócio com a cidade.",
        };
      }

      // Mesmo negócio = mesmo resultado: reaproveita o diagnóstico salvo por 7 dias,
      // não importa qual link ou nome a pessoa usou nem em qual servidor caiu.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: salvo } = await supabaseAdmin
        .from("diagnosticos_cache")
        .select("relatorio, created_at")
        .eq("place_id", alvo.id ?? "")
        .maybeSingle();
      if (salvo && Date.now() - new Date(salvo.created_at).getTime() < FIXO_MS) {
        const relatorio = salvo.relatorio as unknown as SimReport;
        const resultado: SimResultado = { ok: true, relatorio };
        gravarCache(chaveCache, resultado);
        await completarLead(leadId, relatorio, businessName, alvo.id);
        return resultado;
      }

      // 2. Comparar com os concorrentes da cidade. Só a categoria serve de base:
      // buscar pelo próprio nome do negócio devolve ele mesmo, o que não é ranking.
      const cidade = extrairCidade(alvo.formattedAddress);
      const segmento = segmentoDoNegocio(alvo);
      const consultaConcorrentes = segmento && cidade ? `${segmento.rotulo} em ${cidade}` : "";

      let concorrentes: PlaceLike[] = [];
      if (consultaConcorrentes) {
        const json = await google("/v1/places:searchText", "POST", MASK_LISTA, {
          textQuery: consultaConcorrentes,
          maxResultCount: 20,
          languageCode: "pt-BR",
          regionCode: "BR",
          rankPreference: "RELEVANCE",
        });
        // Só entram negócios do mesmo segmento; o próprio cliente sempre conta.
        concorrentes = listar(json)
          .filter((p) => p.id === alvo?.id || (segmento && mesmoSegmento(segmento, p)))
          .slice(0, 10);
      }

      const outros = concorrentes.filter((p) => p.id !== alvo?.id);
      const indice = concorrentes.findIndex((p) => p.id === alvo?.id);
      // Sem outro negócio na lista não existe ranking: a posição não conta.
      const posicao = outros.length > 0 && indice >= 0 ? indice + 1 : null;
      const buscaUsada = outros.length > 0 ? consultaConcorrentes : "";

      const relatorio = buildReport({ alvo, busca: concorrentes, posicao, buscaUsada });
      const resultado: SimResultado = { ok: true, relatorio };
      gravarCache(chaveCache, resultado);
      const { error: erroFixo } = await supabaseAdmin
        .from("diagnosticos_cache")
        .upsert({ place_id: alvo.id ?? "", relatorio: relatorio as never, created_at: new Date().toISOString() });
      if (erroFixo) console.error(`Falha ao fixar diagnóstico: ${erroFixo.message}`);
      await completarLead(leadId, relatorio, businessName, alvo.id);
      return resultado;
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : "falha inesperada";
      return {
        ok: false,
        erro: `A consulta ao Google não concluiu: ${motivo} Tente de novo em instantes.`,
      };
    }
  });
