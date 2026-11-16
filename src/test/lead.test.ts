import { describe, expect, it, vi } from "vitest";
import { CAPTURA_FALHOU, capturarWhatsApp } from "@/lib/lead";

describe("Captura obrigatória para a V2", () => {
  it("devolve a linha salva somente após confirmar a gravação", async () => {
    const salvar = vi.fn().mockResolvedValue({ data: { id: "abc-123" }, error: null });
    await expect(capturarWhatsApp(" (48) 99999-1234 ", salvar)).resolves.toEqual({ id: "abc-123" });
    expect(salvar).toHaveBeenCalledWith("(48) 99999-1234");
  });

  it("não libera quando a gravação devolve erro", async () => {
    await expect(
      capturarWhatsApp("48999991234", async () => ({ data: null, error: { message: "offline" } })),
    ).rejects.toThrow(CAPTURA_FALHOU);
  });

  it("não libera quando a gravação não devolve a linha", async () => {
    await expect(
      capturarWhatsApp("48999991234", async () => ({ data: null, error: null })),
    ).rejects.toThrow(CAPTURA_FALHOU);
  });

  it("não libera quando a gravação falha na rede", async () => {
    await expect(
      capturarWhatsApp("48999991234", async () => {
        throw new Error("offline");
      }),
    ).rejects.toThrow();
  });

  it("não salva nem libera sem um WhatsApp válido", async () => {
    const salvar = vi.fn();
    await expect(capturarWhatsApp("123", salvar)).rejects.toThrow();
    expect(salvar).not.toHaveBeenCalled();
  });
});
