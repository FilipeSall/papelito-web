import { describe, expect, it } from "vitest";

import { validateFullName, validateNamePart, validatePhone } from "./person";

describe("validateFullName", () => {
  it("accepts legitimate Portuguese names", () => {
    expect(validateFullName("José D'Ávila")).toBeUndefined();
    expect(validateFullName("Maria-Luíza Sá")).toBeUndefined();
    expect(validateFullName("Ana de la Cruz da Silva dos Santos de Oliveira")).toBeUndefined();
  });

  it("collapses unicode spaces so a name pasted from a document is not rejected", () => {
    expect(validateFullName("Maria Luíza Sá")).toBeUndefined();
    expect(validateFullName("João   Pedro")).toBeUndefined();
  });

  it("rejects names with a single token, markup, digits, symbols, emoji, or excess length", () => {
    for (const value of [
      "A",
      "QA 12345",
      "<script>alert(1)</script>",
      "QA @#$%",
      "QA 🚀 Teste",
      "A".repeat(121),
    ]) {
      expect(validateFullName(value)).toBeDefined();
    }
  });

  it("separates the missing-surname message from the charset message", () => {
    expect(validateFullName("Ana-Maria")).toBe("Informe nome e sobrenome.");
    expect(validateFullName("Ana Maria 2")).toBe(
      "Informe apenas letras, espaços, apóstrofos e hífens no nome.",
    );
  });

  /**
   * A regex anterior era ambígua no espaço e crescia exponencialmente: 62 caracteres já levavam
   * 17 s e travavam a aba. O teto de 120 caracteres não era proteção nenhuma.
   */
  it("resolves ambiguous input in linear time", () => {
    const probe = `${"a ".repeat(59)}1`;
    const started = performance.now();

    expect(validateFullName(probe)).toBeDefined();
    expect(performance.now() - started).toBeLessThan(50);
  });
});

describe("validateNamePart", () => {
  it("accepts a single word and reports the caller's message when empty", () => {
    expect(validateNamePart("Silva", "Informe o seu sobrenome.")).toBeUndefined();
    expect(validateNamePart("  ", "Informe o seu sobrenome.")).toBe("Informe o seu sobrenome.");
  });

  it("rejects digits, markup, and symbols", () => {
    for (const value of ["12345", "<script>", "@#$%"]) {
      expect(validateNamePart(value, "Informe o seu nome.")).toBe(
        "Informe apenas letras, espaços, apóstrofos e hífens no nome.",
      );
    }
  });
});

describe("validatePhone", () => {
  it("accepts Brazilian formats with DDD and country code", () => {
    expect(validatePhone("(11) 99999-9999")).toBeUndefined();
    expect(validatePhone("5511999999999")).toBeUndefined();
    expect(validatePhone("+55 (11) 99999-9999")).toBeUndefined();
  });

  it("keeps a landline from area code 55 intact instead of reading it as a country code", () => {
    expect(validatePhone("(55) 3220-1234")).toBeUndefined();
  });

  it("collapses unicode spaces before validating", () => {
    expect(validatePhone("(11) 99999-9999")).toBeUndefined();
  });

  it("rejects invalid lengths, repeated digits, and letters", () => {
    for (const value of ["619999888", "11111111111", "00000000000", "abcdefghijk"]) {
      expect(validatePhone(value)).toBeDefined();
    }
  });
});
