import { describe, expect, it } from "vitest";

import {
  formatCep,
  formatCnpj,
  formatCpf,
  isAlphanumericCnpj,
  isValidCep,
  isValidCnpj,
  isValidCpf,
  normalizeCep,
  normalizeCnpj,
  normalizeCpf,
} from "./brazilian-documents";

describe("brazilian-documents — CPF", () => {
  it("validates a correct CPF (masked and digits)", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejects a CPF with wrong check digit", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
  });

  it("normalizes and masks CPF", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
    expect(normalizeCpf("5299822472")).toBe("");
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });
});

describe("brazilian-documents — CNPJ numérico", () => {
  it("validates a correct numeric CNPJ", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("rejects a numeric CNPJ with wrong check digit", () => {
    expect(isValidCnpj("11222333000180")).toBe(false);
  });

  it("numeric CNPJ is not classified as alphanumeric", () => {
    expect(isAlphanumericCnpj("11222333000181")).toBe(false);
  });
});

describe("brazilian-documents — CNPJ alfanumérico", () => {
  it("validates the official example 12.ABC.345/01DE-35", () => {
    expect(isValidCnpj("12.ABC.345/01DE-35")).toBe(true);
    expect(isValidCnpj("12ABC34501DE35")).toBe(true);
  });

  it("preserves letters and uppercases in normalize/format", () => {
    expect(normalizeCnpj("12.abc.345/01de-35")).toBe("12ABC34501DE35");
    expect(formatCnpj("12abc34501de35")).toBe("12.ABC.345/01DE-35");
  });

  it("does not strip letters with \\D during masking", () => {
    expect(formatCnpj("12ABC")).toBe("12.ABC");
  });

  it("flags an alphanumeric CNPJ as alphanumeric", () => {
    expect(isAlphanumericCnpj("12ABC34501DE35")).toBe(true);
  });

  it("rejects an alphanumeric CNPJ with wrong check digit", () => {
    expect(isValidCnpj("12ABC34501DE34")).toBe(false);
  });

  it("normalize rejects wrong length", () => {
    expect(normalizeCnpj("12ABC34501DE3")).toBe("");
  });
});

describe("brazilian-documents — CEP", () => {
  it("validates CEP format only (not existence)", () => {
    expect(isValidCep("70000-000")).toBe(true);
    expect(isValidCep("70000000")).toBe(true);
    expect(isValidCep("7000000")).toBe(false);
  });

  it("normalizes and masks CEP", () => {
    expect(normalizeCep("70000-000")).toBe("70000000");
    expect(formatCep("70000000")).toBe("70000-000");
  });
});
