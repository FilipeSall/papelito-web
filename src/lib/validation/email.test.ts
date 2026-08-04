import { describe, expect, it } from "vitest";

import { emailsMatch, normalizeEmail } from "./email";

describe("normalizeEmail", () => {
  it("remove espaços das pontas e baixa a caixa", () => {
    expect(normalizeEmail("  Fiscal@Empresa.COM  ")).toBe("fiscal@empresa.com");
  });

  // Remover ponto ou sufixo +tag associaria endereços de contas diferentes.
  it("não altera ponto nem sufixo +tag da parte local", () => {
    expect(normalizeEmail("Jo.Ao+NF@Empresa.com")).toBe("jo.ao+nf@empresa.com");
  });
});

describe("emailsMatch", () => {
  it("ignora caixa e espaços", () => {
    expect(emailsMatch(" DONO@empresa.com ", "dono@empresa.com")).toBe(true);
  });

  it("distingue endereços diferentes", () => {
    expect(emailsMatch("dono@empresa.com", "contabilidade@parceiro.com")).toBe(false);
  });

  it("distingue endereços que só diferem por ponto", () => {
    expect(emailsMatch("jo.ao@empresa.com", "joao@empresa.com")).toBe(false);
  });

  it("nunca casa valores ausentes", () => {
    expect(emailsMatch(null, null)).toBe(false);
    expect(emailsMatch(undefined, "")).toBe(false);
    expect(emailsMatch("dono@empresa.com", null)).toBe(false);
  });
});
