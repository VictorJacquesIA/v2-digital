import { createServerFn } from "@tanstack/react-start";
import { buildReport, ehRedeSocial, extrairUf, mesmoSegmento, segmentoDoNegocio, extrairCidade, type PlaceLike, type SimBusca, type SimReport } from "./simulador-score";
import { CAMPOS_DETALHE, MASK_LISTA, google, listar } from "./google-places";
import { checarSite, montarIa, perguntarIa } from "./diagnostico-extra";
import { CAPTURA_FALHOU, capturarWhatsApp, limparNome, WHATSAPP_INVALIDO, whatsappValido, abreNovoCiclo } from "./lead";

export type SimResultado =
  /** token: abre o diagnóstico em /diagnostico/<token> para guardar ou salvar em PDF. */
  | { ok: true; relatorio: SimReport; token?: string }
  | { ok: false; erro: string };

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

/* ------------------------------------------------------------------ */
/* Sugestões de empresa enquanto a pessoa digita (Autocomplete)        */
/* ------------------------------------------------------------------ */

export type Sugestao = { placeId: string; nome: string; endereco: string };
export type SugestoesResultado = { ok: true; sugestoes: Sugestao[] } | { ok: false; erro: string };

const PLACE_ID_VALIDO = /^[A-Za-z0-9_-]{10,300}$/;
const SESSAO_VALIDA = /^[A-Za-z0-9-]{8,64}$/;

/**
 * Limite por IP que protege a cota do Google contra abuso do formulário público.
 * Uma "busca" é uma sessão de digitação (do primeiro caractere até escolher a empresa):
 * até 5 buscas por minuto. Cada busca aceita até 15 pedidos de sugestão, o bastante
 * para digitar um nome, e o IP tem um teto de 40 pedidos por minuto no total.
 */
export const BUSCAS_POR_MINUTO = 5;
const PEDIDOS_POR_BUSCA = 15;
const PEDIDOS_POR_MINUTO = 40;
type Janela = { inicio: number; sessoes: Map<string, number>; pedidos: number };
const janelasPorIp = new Map<string, Janela>();
export function dentroDoLimite(ip: string, sessao: string, agora = Date.now()): boolean {
  let j = janelasPorIp.get(ip);
  if (!j || agora - j.inicio > 60_000) {
    if (janelasPorIp.size > 5000) janelasPorIp.clear();
    j = { inicio: agora, sessoes: new Map(), pedidos: 0 };
    janelasPorIp.set(ip, j);
  }
  const chave = sessao || "sem-sessao";
  const daSessao = j.sessoes.get(chave);
  if (daSessao === undefined && j.sessoes.size >= BUSCAS_POR_MINUTO) return false;
  if ((daSessao ?? 0) >= PEDIDOS_POR_BUSCA || j.pedidos >= PEDIDOS_POR_MINUTO) return false;
  j.sessoes.set(chave, (daSessao ?? 0) + 1);
  j.pedidos += 1;
  return true;
}

async function ipDoVisitante(): Promise<string> {
  try {
    const { getRequest } = await import("@tanstack/react-start/server");
    const h = getRequest().headers;
    return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0]!.trim();
  } catch {
    return "local";
  }
}

export const sugerirEmpresas = createServerFn({ method: "POST" })
  .inputValidator((data: { texto?: string; sessao?: string }) => ({
    texto: String(data?.texto ?? "").trim().slice(0, 80),
    sessao: String(data?.sessao ?? ""),
  }))
  .handler(async ({ data }): Promise<SugestoesResultado> => {
    if (data.texto.length < 3) return { ok: true, sugestoes: [] };
    if (!dentroDoLimite(await ipDoVisitante(), SESSAO_VALIDA.test(data.sessao) ? data.sessao : "")) {
      return { ok: false, erro: "Muitas buscas seguidas. Espere um minuto ou cole o link do Google Maps." };
    }
    try {
      const json = await google(
        "/v1/places:autocomplete",
        "POST",
        "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat",
        {
          input: data.texto,
          languageCode: "pt-BR",
          includedRegionCodes: ["br"],
          includedPrimaryTypes: ["establishment"],
          ...(SESSAO_VALIDA.test(data.sessao) ? { sessionToken: data.sessao } : {}),
        },
      );
      const lista = (json["suggestions"] as Array<{
        placePrediction?: { placeId?: string; structuredFormat?: { mainText?: { text?: string }; secondaryText?: { text?: string } } };
      }> | undefined) ?? [];
      const sugestoes = lista
        .map((s) => s.placePrediction)
        .filter((p): p is NonNullable<typeof p> => !!p?.placeId && PLACE_ID_VALIDO.test(p.placeId))
        .slice(0, 5)
        .map((p) => ({
          placeId: p.placeId!,
          nome: p.structuredFormat?.mainText?.text ?? "",
          endereco: p.structuredFormat?.secondaryText?.text ?? "",
        }));
      return { ok: true, sugestoes };
    } catch (erro) {
      console.error("Falha nas sugestões do Google:", erro);
      return { ok: false, erro: "A busca pelo nome não respondeu agora. Cole o link do Google Maps." };
    }
  });

export const analisarPerfil = createServerFn({ method: "POST" })
  .inputValidator((data: { mapsUrl?: string; placeId?: string; sessao?: string; businessName?: string; nomeContato?: string; whatsapp?: string }) => ({
    mapsUrl: String(data?.mapsUrl ?? "").trim(),
    placeId: PLACE_ID_VALIDO.test(String(data?.placeId ?? "")) ? String(data?.placeId) : "",
    sessao: SESSAO_VALIDA.test(String(data?.sessao ?? "")) ? String(data?.sessao) : "",
    businessName: String(data?.businessName ?? "").trim(),
    nomeContato: limparNome(String(data?.nomeContato ?? "")),
    whatsapp: String(data?.whatsapp ?? "").trim(),
  }))
  .handler(async ({ data }): Promise<SimResultado> => {
    const { placeId: placeEscolhido, sessao, businessName, nomeContato, whatsapp } = data;
    // Empresa escolhida na lista: o link do Maps fica salvo no lead para o painel.
    // Formato oficial do Google Maps; o place_id fica no link (query_place_id), que placeIdDaUrl também lê.
    const mapsUrl =
      data.mapsUrl ||
      (placeEscolhido
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(businessName || "empresa")}&query_place_id=${placeEscolhido}`
        : "");

    // O diagnóstico só roda depois que o contato fica gravado para a V2.
    // A gravação acontece no servidor: o visitante não tem permissão de
    // leitura na tabela, então o navegador não consegue confirmar a linha.
    if (!whatsappValido(whatsapp)) {
      return { ok: false, erro: WHATSAPP_INVALIDO };
    }
    let leadId = "";
    // Token do link público deste diagnóstico (um por contato).
    let token: string | undefined;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const lead = await capturarWhatsApp<{ id: string; diagnostico_token: string | null }>(whatsapp, async (bruto) => {
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
              ...(nomeContato ? { nome_contato: nomeContato } : {}),
              ...(novoCiclo && existente.status !== "cliente" ? { status: "novo", atendido: false } : {}),
            })
            .eq("id", existente.id)
            .select("id, diagnostico_token")
            .single();
        }
        return supabaseAdmin
          .from("leads_diagnostico")
          .insert({ whatsapp: numero, maps_url: mapsUrl || null, business_name: businessName || null, nome_contato: nomeContato || null })
          .select("id, diagnostico_token")
          .single();
      });
      leadId = lead.id;
      token = lead.diagnostico_token ?? undefined;
    } catch (erro) {
      console.error("Falha ao gravar o contato do diagnóstico:", erro);
      return { ok: false, erro: CAPTURA_FALHOU };
    }

    if (!placeEscolhido && !mapsUrl) {
      return { ok: false, erro: "Escolha sua empresa na lista ou cole o link do seu perfil no Google Maps." };
    }
    if (!placeEscolhido && !/^https?:\/\//i.test(mapsUrl) && !LINK_CURTO.test(mapsUrl)) {
      return { ok: false, erro: "Isso não parece um link do Google Maps. Cole o endereço que começa com https://." };
    }

    const chaveCache = placeEscolhido ? `place:${placeEscolhido}` : `${mapsUrl}|${businessName}`;
    const guardado = lerCache(chaveCache);
    if (guardado) {
      if (guardado.ok) {
        await completarLead(leadId, guardado.relatorio, businessName);
        return { ...guardado, ...(token ? { token } : {}) };
      }
      return guardado;
    }

    try {
      // Empresa escolhida na lista não tem link para abrir: vai direto pelo place_id.
      const urlFinal = placeEscolhido ? "" : await resolverLink(mapsUrl);
      const placeId = placeEscolhido || placeIdDaUrl(urlFinal);
      const coords = coordenadasDaUrl(urlFinal);
      const nomeNaUrl = nomeDaUrl(urlFinal);

      // 1. Achar o negócio do cliente
      let alvo: PlaceLike | null = null;

      if (placeId) {
        // O sessionToken fecha a sessão das sugestões: o Google cobra a busca toda como uma só.
        const sessaoQs = placeEscolhido && sessao ? `&sessionToken=${sessao}` : "";
        const json = await google(`/v1/places/${placeId}?languageCode=pt-BR${sessaoQs}`, "GET", CAMPOS_DETALHE);
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
          erro: "Não encontramos esse negócio no Google. Procure pelo nome de novo ou cole o link do Google Maps.",
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
        return { ...resultado, ...(token ? { token } : {}) };
      }

      // 2. Comparar com os concorrentes da cidade. Só a categoria serve de base:
      // buscar pelo próprio nome do negócio devolve ele mesmo, o que não é ranking.
      const cidade = extrairCidade(alvo.formattedAddress);
      const segmento = segmentoDoNegocio(alvo);
      const consultaConcorrentes = segmento && cidade ? `${segmento.rotulo} em ${cidade}` : "";

      /** Roda uma busca e devolve os 10 primeiros do mesmo segmento (o próprio cliente sempre conta). */
      const buscar = async (textQuery: string, extra: Record<string, unknown> = {}): Promise<PlaceLike[]> => {
        const json = await google("/v1/places:searchText", "POST", MASK_LISTA, {
          textQuery,
          maxResultCount: 20,
          languageCode: "pt-BR",
          regionCode: "BR",
          rankPreference: "RELEVANCE",
          ...extra,
        });
        return listar(json)
          .filter((p) => p.id === alvo?.id || (segmento && mesmoSegmento(segmento, p)))
          .slice(0, 10);
      };
      const posicaoEm = (lista: PlaceLike[]): number | null => {
        const i = lista.findIndex((p) => p.id === alvo?.id);
        return lista.some((p) => p.id !== alvo?.id) && i >= 0 ? i + 1 : null;
      };

      // Três jeitos de o cliente procurar: pela cidade, pelo "melhor" e perto da empresa.
      // Os extras rodam em paralelo; se um falhar, o diagnóstico segue sem ele.
      const lat = alvo.location?.latitude;
      const lng = alvo.location?.longitude;
      const pertoDaqui = typeof lat === "number" && typeof lng === "number"
        ? { locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 3000 } } }
        : null;
      // Pacote 2: a pergunta à IA e a checagem do site rodam junto com as buscas.
      const uf = extrairUf(alvo.formattedAddress);
      const iaP = segmento && cidade ? perguntarIa(segmento.rotulo, uf ? `${cidade}, ${uf}` : cidade) : Promise.resolve(null);
      const siteP = checarSite(alvo.websiteUri?.trim() || null, alvo.nationalPhoneNumber);

      const [concorrentes, melhor, perto] = consultaConcorrentes
        ? await Promise.all([
            buscar(consultaConcorrentes),
            buscar(`melhor ${segmento!.rotulo} em ${cidade}`).catch(() => null),
            pertoDaqui ? buscar(segmento!.rotulo, pertoDaqui).catch(() => null) : Promise.resolve(null),
          ])
        : [[] as PlaceLike[], null, null];

      const outros = concorrentes.filter((p) => p.id !== alvo?.id);
      // Sem outro negócio na lista não existe ranking: a posição não conta.
      const posicao = posicaoEm(concorrentes);
      const buscaUsada = outros.length > 0 ? consultaConcorrentes : "";

      const buscas: SimBusca[] = buscaUsada
        ? [
            { rotulo: "Busca pela cidade", termo: consultaConcorrentes, posicao },
            ...(melhor ? [{ rotulo: "Quem procura o melhor", termo: `melhor ${segmento!.rotulo} em ${cidade}`, posicao: posicaoEm(melhor) }] : []),
            ...(perto ? [{ rotulo: "Quem está perto da empresa", termo: `${segmento!.rotulo} (a até 3 km)`, posicao: posicaoEm(perto) }] : []),
          ]
        : [];

      const [respostaIa, site] = await Promise.all([iaP.catch(() => null), siteP.catch(() => null)]);
      const nomesTop3 = concorrentes
        .filter((p) => p.id !== alvo?.id)
        .slice(0, 3)
        .map((p) => p.displayName?.text?.trim() ?? "")
        .filter(Boolean);
      const ia = respostaIa ? montarIa(respostaIa, alvo.displayName?.text?.trim() ?? "", nomesTop3) : null;

      const relatorio = buildReport({
        alvo,
        busca: concorrentes,
        posicao,
        buscaUsada,
        buscas,
        geradoEm: new Date().toISOString(),
        ia,
        siteCheck: ehRedeSocial(alvo.websiteUri) ? null : site,
      });
      const resultado: SimResultado = { ok: true, relatorio };
      gravarCache(chaveCache, resultado);
      const { error: erroFixo } = await supabaseAdmin
        .from("diagnosticos_cache")
        .upsert({ place_id: alvo.id ?? "", relatorio: relatorio as never, created_at: new Date().toISOString() });
      if (erroFixo) console.error(`Falha ao fixar diagnóstico: ${erroFixo.message}`);
      await completarLead(leadId, relatorio, businessName, alvo.id);
      return { ...resultado, ...(token ? { token } : {}) };
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : "falha inesperada";
      return {
        ok: false,
        erro: `A consulta ao Google não concluiu: ${motivo} Tente de novo em instantes.`,
      };
    }
  });

/* ------------------------------------------------------------------ */
/* Link público do diagnóstico (/diagnostico/<token>)                  */
/* ------------------------------------------------------------------ */

export type DiagnosticoPublico = { relatorio: SimReport; atualizado: string | null } | null;

export const lerDiagnosticoPublico = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => ({ token: String(d?.token ?? "").slice(0, 100) }))
  .handler(async ({ data }): Promise<DiagnosticoPublico> => {
    if (!/^[0-9a-f]{20,64}$/i.test(data.token)) return null;
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
    const { data: rows, error } = await sb.rpc("diagnostico_publico", { _token: data.token });
    if (error) { console.error(error); return null; }
    const r = (rows as Array<{ dados: unknown; atualizado: string | null }> | null)?.[0];
    if (!r?.dados) return null;
    return { relatorio: r.dados as SimReport, atualizado: r.atualizado };
  });
