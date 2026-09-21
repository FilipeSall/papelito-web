import { describe, expect, it } from "vitest";

import { braspressErrorMessage } from "./braspress-error-message";

const TECHNICAL_LEAK = "SQLSTATE[HY000] wp_papelito_vendor_integrations";

describe("braspressErrorMessage", () => {
  it("diz que a senha pedida é a da Papelito, não a da Braspress", () => {
    const message = braspressErrorMessage(
      { code: "papelito_vendor_integration_current_password_invalid", status: 403 },
      "save",
    );

    expect(message).toMatch(/senha da Papelito/i);
    expect(message).toMatch(/não.*da Braspress/i);
  });

  it("manda completar o cadastro quando falta CNPJ para habilitar", () => {
    expect(
      braspressErrorMessage(
        { code: "papelito_vendor_integration_profile_incomplete", status: 422 },
        "save",
      ),
    ).toMatch(/CNPJ no cadastro/i);
  });

  it("pede para esperar quando o limite de escrita estourou", () => {
    expect(
      braspressErrorMessage({ code: "papelito_vendor_integration_rate_limited", status: 429 }, "save"),
    ).toMatch(/alguns minutos/i);
  });

  it("explica que credencial pela metade não apaga a que já existe", () => {
    expect(
      braspressErrorMessage(
        { code: "papelito_vendor_integration_credentials_incomplete", status: 422 },
        "save",
      ),
    ).toMatch(/os dois em branco.*manter a credencial/i);
  });

  it("garante ao vendor que a configuração anterior sobreviveu à falha", () => {
    expect(
      braspressErrorMessage({ code: "papelito_vendor_integration_save_failed", status: 500 }, "save"),
    ).toMatch(/configuração anterior continua/i);
  });

  it("usa a redação de remoção quando a ação foi remover", () => {
    const message = braspressErrorMessage(
      { code: "papelito_vendor_integration_delete_failed", status: 500 },
      "remove",
    );

    expect(message).toMatch(/remover/i);
    expect(message).toMatch(/integração continua/i);
  });

  it("manda recadastrar quando o cofre não abre mais a credencial", () => {
    for (const code of [
      "papelito_vendor_integration_secret_unavailable",
      "papelito_vendor_integration_secret_invalid",
    ]) {
      expect(braspressErrorMessage({ code, status: 503 }, "save")).toMatch(/cadastre.*de novo/i);
    }
  });

  it("traduz a sessão expirada e a conta suspensa sem depender de código", () => {
    expect(braspressErrorMessage({ status: 401 }, "save")).toMatch(/sessão expirou/i);
    expect(
      braspressErrorMessage({ code: "papelito_account_suspended", status: 403 }, "save"),
    ).toMatch(/suspensa/i);
  });

  it("nunca ecoa a mensagem crua do backend para um código desconhecido", () => {
    const message = braspressErrorMessage(
      { code: "papelito_vendor_integration_nova_regra", message: TECHNICAL_LEAK, status: 500 },
      "save",
    );

    expect(message).not.toContain(TECHNICAL_LEAK);
    expect(message).toBe("Não foi possível salvar a integração. Tente novamente.");
  });
});
