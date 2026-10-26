import { describe, expect, it } from "vitest";

import {
  companyApplicationStep1Path,
  REVENDEDOR_FORM_PATH,
  step1ErrorsFromApiErrors,
} from "./company-application-step1";

describe("company-application-step1", () => {
  it("maps WordPress field errors to step 1 fields, including the store data", () => {
    expect(
      step1ErrorsFromApiErrors({
        full_name: ["Informe nome e sobrenome."],
        birth_date: ["Data inválida."],
        discovery_channel: ["Escolha como conheceu a Papelito."],
        has_sold_papelito: ["", "Escolha uma opção."],
        password: ["Senha fraca."],
      }),
    ).toEqual({
      name: "Informe nome e sobrenome.",
      birthDate: "Data inválida.",
      discoveryChannel: "Escolha como conheceu a Papelito.",
      hasSoldPapelito: "Escolha uma opção.",
    });
  });

  it("returns to the revendedor form when the application started there", () => {
    const lead = {
      source: "revendedor" as const,
      storeName: "Loja",
      instagram: "loja",
      discoveryChannel: "",
      hasSoldPapelito: "" as const,
    };

    expect(companyApplicationStep1Path({ lead }, "/carrinho")).toBe(REVENDEDOR_FORM_PATH);
  });

  it("returns to /cadastro keeping the callback otherwise", () => {
    expect(companyApplicationStep1Path({}, "/carrinho")).toBe("/cadastro?callbackUrl=%2Fcarrinho");
    expect(companyApplicationStep1Path(null, null)).toBe("/cadastro");
  });
});
