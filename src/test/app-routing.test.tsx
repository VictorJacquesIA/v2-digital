import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER, whatsappLink } from "@/lib/contact";
import { WHATSAPP_INVALIDO, whatsappValido } from "@/lib/lead";
import {
  contatoErros,
  contatoMensagem,
  MAPS_VAZIO,
  NOME_VAZIO,
  RESPONSAVEL_VAZIO,
  WHATSAPP_VAZIO,
} from "@/lib/contact-form";
import {
  COMPLEMENTOS,
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

  it("cita Imbituba em pelo menos um H2", () => {
    expect(H2S.some((h) => h.includes("Imbituba"))).toBe(true);
  });

  it("promete meta com prazo, nunca posição garantida nem trabalho sem cobrar", () => {
    expect(OFERTA.confianca).toBe(
      "Meta de Top 3 no mapa em até 90 dias, com relatório mensal mostrando cada avanço.",
    );
    expect(OFERTA.metaDias).toBe(90);
    expect(OFERTA.confianca).not.toMatch(/sem cobrar|garant/i);
    for (const item of FAQ) {
      expect(item.resposta).not.toMatch(/sem cobrar/i);
      expect(item.resposta).not.toMatch(/garantimos|garantido|garantia/i);
    }
  });

  it("mantém os 4 passos do método na ordem do roteiro", () => {
    expect(METODO.passos.map((p) => p.nome)).toEqual([
      "Diagnóstico",
      "Mapa",
      "IA",
      "Prova",
    ]);
  });

  it("tem exatamente 3 complementos, na copy do cliente", () => {
    expect(COMPLEMENTOS.cards.map((c) => c.nome)).toEqual([
      "Placa QR + NFC de Avaliação",
      "Tráfego Pago Local",
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

describe("Formulário final", () => {
  const cheio = {
    nome: "Padaria Central",
    responsavel: "Maria Silva",
    telefone: "(54) 99950-7960",
    maps: "https://maps.app.goo.gl/abc123",
  };

  it("exige os quatro campos, com a instrução do cliente", () => {
    expect(contatoErros({ nome: "  ", responsavel: "", telefone: "", maps: "" })).toEqual({
      nome: NOME_VAZIO,
      responsavel: RESPONSAVEL_VAZIO,
      telefone: WHATSAPP_VAZIO,
      maps: MAPS_VAZIO,
    });
    expect(NOME_VAZIO).toBe("Informe o nome do seu negócio");
    expect(RESPONSAVEL_VAZIO).toBe("Informe o nome do responsável");
    expect(contatoErros(cheio)).toEqual({});
  });

  it("leva os quatro campos na mensagem do WhatsApp", () => {
    expect(contatoMensagem(cheio)).toBe(
      "Olá! Vim pelo site da V2 Digital.\nNegócio: Padaria Central\nResponsável: Maria Silva\nWhatsApp: (54) 99950-7960\nGoogle Maps ou cidade: https://maps.app.goo.gl/abc123",
    );
  });

  it("abre o número do cliente com a mensagem inteira legível", () => {
    const mensagem = contatoMensagem(cheio);
    const url = whatsappLink(mensagem);
    expect(url.startsWith("https://wa.me/5554999507960?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1] ?? "")).toBe(mensagem);
  });
});
