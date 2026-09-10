import { describe, expect, it } from "vitest";

import {
  chamadoWhatsappHref,
  chamadoWhatsappMessage,
  chamadoWhatsappNumber,
} from "./whatsapp";

describe("chamadoWhatsappNumber", () => {
  it("monta o número a partir do celular mascarado", () => {
    expect(chamadoWhatsappNumber("(61) 99973-3064")).toBe("5561999733064");
  });

  it("não duplica o código do país quando ele já vem no valor", () => {
    expect(chamadoWhatsappNumber("+55 (61) 99973-3064")).toBe("5561999733064");
    expect(chamadoWhatsappNumber("5561999733064")).toBe("5561999733064");
  });

  it("aceita fixo de 10 dígitos", () => {
    expect(chamadoWhatsappNumber("(11) 3221-1234")).toBe("551132211234");
  });

  it("não come o código do país de um número com DDD 55", () => {
    expect(chamadoWhatsappNumber("(55) 3221-1234")).toBe("555532211234");
  });

  it("devolve null quando não há telefone usável", () => {
    expect(chamadoWhatsappNumber("")).toBeNull();
    expect(chamadoWhatsappNumber("1234")).toBeNull();
    expect(chamadoWhatsappNumber("abc")).toBeNull();
    expect(chamadoWhatsappNumber("   ")).toBeNull();
  });
});

describe("chamadoWhatsappHref", () => {
  it("monta o link sem texto quando nenhuma mensagem é passada", () => {
    expect(chamadoWhatsappHref("(61) 99973-3064")).toBe("https://wa.me/5561999733064");
  });

  it("codifica o texto pré-preenchido", () => {
    expect(chamadoWhatsappHref("(61) 99973-3064", chamadoWhatsappMessage("14094"))).toBe(
      "https://wa.me/5561999733064?text=Ol%C3%A1!%20Falo%20sobre%20o%20pedido%20%2314094%20na%20Papelito.",
    );
  });

  it("devolve null em vez de um link sem número", () => {
    expect(chamadoWhatsappHref("", "oi")).toBeNull();
    expect(chamadoWhatsappHref("1234", "oi")).toBeNull();
  });
});
