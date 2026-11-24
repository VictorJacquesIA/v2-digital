/*
 * Cliente da Google Places API (New), usado pelo diagnóstico e pela prospecção do CRM.
 * Só é chamado dentro de handlers de createServerFn (roda no servidor).
 */
import type { PlaceLike } from "./simulador-score";

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
  "location",
  "businessStatus",
].join(",");
export const MASK_LISTA = CAMPOS.split(",").map((c) => `places.${c}`).join(",");
/** Só no perfil do cliente: as avaliações custam mais e não entram nas buscas da cidade. */
export const CAMPOS_DETALHE = `${CAMPOS},reviews`;

/* ------------------------------------------------------------------ */
/* Chamadas ao Google                                                  */
/*                                                                     */
/* A chamada vai direto para a Places API com GOOGLE_PLACES_API_KEY.    */
/* ------------------------------------------------------------------ */

const PLACES = "https://places.googleapis.com";

export async function google(
  path: string,
  method: "GET" | "POST",
  mask: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const minhaChave = process.env["GOOGLE_PLACES_API_KEY"]?.trim();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Goog-FieldMask": mask,
  };
  let url: string;

  if (minhaChave) {
    url = `${PLACES}${path}`;
    headers["X-Goog-Api-Key"] = minhaChave;
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
