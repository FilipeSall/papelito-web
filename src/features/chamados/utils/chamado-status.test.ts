import { describe, expect, it } from "vitest";

import { chamadoStatusMeta } from "./chamado-status";

describe("chamadoStatusMeta", () => {
  it("chamado aberto aceita resposta e conta na fila", () => {
    const meta = chamadoStatusMeta("aberto");

    expect(meta.label).toBe("Aberto");
    expect(meta.canReply).toBe(true);
    expect(meta.countsAsQueue).toBe(true);
  });

  it("chamado encerrado é neutro, não comemorativo", () => {
    const meta = chamadoStatusMeta("encerrado");

    expect(meta.label).toBe("Encerrado");
    expect(meta.canReply).toBe(false);
    expect(meta.tone).toBe("neutral");
  });

  it("situação desconhecida cai num fallback fail-closed", () => {
    const meta = chamadoStatusMeta("em_analise");

    expect(meta.label).toBe("Situação desconhecida");
    expect(meta.canReply).toBe(false);
  });
});
