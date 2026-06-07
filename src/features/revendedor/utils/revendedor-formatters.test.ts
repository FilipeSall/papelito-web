import { describe, expect, it } from "vitest";

import {
  formatCep,
  formatCnpj,
  formatPhone,
  isValidCep,
  isValidCnpj,
  isValidEmail,
  normalizeCep,
  sanitizeInstagramHandle,
} from "./revendedor-formatters";

describe("revendedor-formatters", () => {
  it("formats CNPJ progressively", () => {
    expect(formatCnpj("12")).toBe("12");
    expect(formatCnpj("12345678000195")).toBe("12.345.678/0001-95");
  });

  it("validates official CNPJ digits and rejects repeated sequences", () => {
    expect(isValidCnpj("12.345.678/0001-95")).toBe(true);
    expect(isValidCnpj("11.111.111/1111-11")).toBe(false);
    expect(isValidCnpj("12.345.678/0001-00")).toBe(false);
  });

  it("formats phone and cep with Brazilian masks", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
    expect(formatCep("01310930")).toBe("01310-930");
  });

  it("normalizes cep and validates complete values only", () => {
    expect(normalizeCep("01310-930")).toBe("01310930");
    expect(normalizeCep("01310")).toBe("");
    expect(isValidCep("01310-930")).toBe(true);
    expect(isValidCep("01310")).toBe(false);
  });

  it("sanitizes instagram handle and validates e-mail", () => {
    expect(sanitizeInstagramHandle(" @papelito oficial ")).toBe("papelitooficial");
    expect(isValidEmail("cliente@papelito.com")).toBe(true);
    expect(isValidEmail("cliente@papelito")).toBe(false);
  });
});
