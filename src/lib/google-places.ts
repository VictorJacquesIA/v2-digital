/*
 * Cliente da Google Places API (New), usado pelo diagnóstico e pela prospecção do CRM.
 * Só é chamado dentro de handlers de createServerFn (roda no servidor).
 */
import type { PlaceLike } from "./simulador-score";

const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

export const CAMPOS = [
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
export const MASK_LISTA = CAMPOS.split(",").map((c) => `places.${c}`).join(",");

/* ------------------------------------------------------------------ */
/* Chamadas ao Google                                                  */
/*                                                                     */
/* Com a chave do cliente (GOOGLE_PLACES_API_KEY) salva em Secrets, a   */
/* chamada vai direto para a Places API. Sem ela, usa a conexão do      */
/* Google Maps já ligada ao site, pelo gateway.                        */
/* ------------------------------------------------------------------ */

const PLACES = "https://places.googleapis.com";

export async function google(
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

export function listar(json: Record<string, unknown>): PlaceLike[] {
  const places = json["places"];
  return Array.isArray(places) ? (places as PlaceLike[]) : [];
}
