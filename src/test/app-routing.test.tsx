import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER, whatsappLink } from "@/lib/contact";
import { WHATSAPP_INVALIDO, whatsappValido } from "@/lib/lead";
import {
  COMPLEMENTOS,
  CTA_FINAL,
  FAQ,
  H2S,
  METODO,
  OFERTA,
  PROVA,
  textosDaPagina,
} from "@/lib/content";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});

describe("WhatsApp contact", () => {
  it("opens the number the client sent, in international format", () => {
    expect(WHATSAPP_NUMBER).toBe("5554999507960");
    expect(whatsappLink("Olá! Vim pelo site da V2 Digital.")).toBe(
      "https://wa.me/5554999507960?text=Ol%C3%A1!%20Vim%20pelo%20site%20da%20V2%20Digital.",
    );
  });

  it("shows the number with DDD and a dash", () => {
    expect(WHATSAPP_DISPLAY).toBe("(54) 99950-7960");
  });
});

describe("Copy da landing", () => {
  it("não usa nenhuma das palavras que o cliente proibiu", () => {
    const proibidas = ["plaquinha", "cerco", "domínio total", "garantido", "algoritmo"];
    for (const texto of textosDaPagina()) {
      for (const palavra of proibidas) {
        expect(texto.toLowerCase()).not.toContain(palavra);
      }
    }
  });

  it("não prende o site a uma cidade", () => {
    expect(H2S.some((h) => h.includes("Imbituba"))).toBe(false);
  });

  it("oferta principal é reestruturação + placa, sem garantir posição nem trabalho sem cobrar", () => {
    expect(OFERTA.entregas.join(" ")).toMatch(/reestruturado/i);
    expect(OFERTA.entregas.join(" ")).toMatch(/placa/i);
    expect(OFERTA.confianca).not.toMatch(/sem cobrar|garant/i);
    for (const item of FAQ) {
      expect(item.resposta).not.toMatch(/sem cobrar/i);
      expect(item.resposta).not.toMatch(/garantimos|garantido|garantia/i);
    }
  });

  it("mantém os 4 passos do método na ordem do roteiro", () => {
    expect(METODO.passos.map((p) => p.nome)).toEqual([
      "Diagnóstico",
      "Google",
      "IA",
      "Avaliações",
    ]);
  });

  it("tem exatamente 3 complementos, na copy do cliente", () => {
    expect(COMPLEMENTOS.cards.map((c) => c.nome)).toEqual([
      "Acompanhamento Mensal",
      "Tráfego Pago",
      "Site ou Landing Page de Venda",
    ]);
  });

  it("não publica prova social sem dado real", () => {
    expect(PROVA.resultados).toHaveLength(0);
    expect(PROVA.depoimento).toBeNull();
    expect(PROVA.totalAtendidas).toBeNull();
  });

  it("não deixa resposta de FAQ com campo a preencher", () => {
    for (const f of FAQ) {
      expect(f.resposta).not.toMatch(/\[[^\]]+\]/);
    }
  });
});

describe("Portão de WhatsApp do diagnóstico", () => {
  it("aceita os formatos que a pessoa digita de verdade", () => {
    expect(whatsappValido("(54) 99950-7960")).toBe(true);
    expect(whatsappValido("54999507960")).toBe(true);
    expect(whatsappValido("+55 54 99950-7960")).toBe(true);
  });

  it("recusa número curto demais ou vazio, com a mensagem certa", () => {
    expect(whatsappValido("")).toBe(false);
    expect(whatsappValido("99950")).toBe(false);
    expect(whatsappValido("995079601234567890")).toBe(false);
    expect(WHATSAPP_INVALIDO).toBe("Informe um WhatsApp válido, com DDD");
  });
});

describe("Proposta montada na página", () => {
  it("junta a oferta e os complementos numa mensagem só, na ordem da página", async () => {
    const { alternarItem, mensagemProposta } = await import("@/lib/proposta");
    let ids: string[] = [];
    ids = alternarItem(ids, "complemento-02");
    ids = alternarItem(ids, "oferta");
    expect(mensagemProposta(ids)).toBe(
      "Olá! Vim pelo site da V2 Digital.\nQuero uma proposta com:\n• Presença V2 (reestruturação do Google + placa de avaliação)\n• Tráfego Pago",
    );
  });

  it("clicar de novo tira o item", async () => {
    const { alternarItem, itensEscolhidos } = await import("@/lib/proposta");
    const ids = alternarItem(alternarItem([], "complemento-01"), "complemento-01");
    expect(itensEscolhidos(ids)).toHaveLength(0);
  });

  it("o fechamento manda a proposta ou uma mensagem simples", async () => {
    expect(CTA_FINAL.caminhos.map((c) => c.id)).toEqual(["diagnostico", "proposta"]);
    expect(CTA_FINAL.semItens).toContain("quero uma proposta");
  });
});
