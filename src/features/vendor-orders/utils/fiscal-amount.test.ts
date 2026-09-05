import { describe, expect, it } from "vitest";

import { parseFiscalAmountToCents } from "./fiscal-amount";

describe("parseFiscalAmountToCents", () => {
  it("aceita a vírgula decimal brasileira", () => {
    expect(parseFiscalAmountToCents("110,27")).toBe(11027);
    expect(parseFiscalAmountToCents("1.234,56")).toBe(123456);
  });

  it("aceita o ponto decimal que o teclado de celular entrega (regressão)", () => {
    expect(parseFiscalAmountToCents("110.27")).toBe(11027);
    expect(parseFiscalAmountToCents("1,234.56")).toBe(123456);
  });

  it("trata separador com três dígitos como milhar, não como decimal", () => {
    expect(parseFiscalAmountToCents("1.234")).toBe(123400);
    expect(parseFiscalAmountToCents("1,234")).toBe(123400);
  });

  it("completa a casa decimal faltante", () => {
    expect(parseFiscalAmountToCents("110,5")).toBe(11050);
    expect(parseFiscalAmountToCents("0,5")).toBe(50);
  });

  it("lê valor inteiro sem separador", () => {
    expect(parseFiscalAmountToCents("110")).toBe(11000);
  });

  it("aceita valor menor que um real", () => {
    expect(parseFiscalAmountToCents(",27")).toBe(27);
  });

  it("devolve null quando não há número", () => {
    expect(parseFiscalAmountToCents("")).toBeNull();
    expect(parseFiscalAmountToCents("   ")).toBeNull();
    expect(parseFiscalAmountToCents("abc")).toBeNull();
  });

  it("ignora ruído de formatação de moeda", () => {
    expect(parseFiscalAmountToCents("R$ 1.234,56")).toBe(123456);
  });
});
