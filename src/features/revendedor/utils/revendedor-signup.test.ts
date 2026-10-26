import { describe, expect, it } from "vitest";

import type { RevendedorSignupValues } from "../types/revendedor-signup";
import {
  createEmptyRevendedorSignup,
  patchRevendedorSignupField,
  revendedorErrorsFromStep1,
  validateRevendedorSignup,
} from "./revendedor-signup";

const valid: RevendedorSignupValues = {
  storeName: "Tabacaria do Centro",
  firstName: "Joana",
  lastName: "Almeida",
  cpf: "123.456.789-09",
  birthDate: "1985-03-12",
  cnpj: "65.326.368/0001-90",
  phone: "(11) 98765-4321",
  email: "joana@example.com",
  instagram: "tabacaria.centro",
  discoveryChannel: "",
  hasSoldPapelito: "nao",
};

describe("revendedor-signup", () => {
  it("accepts a complete form without the optional discovery channel", () => {
    expect(validateRevendedorSignup(valid)).toEqual({});
  });

  it("requires every identity field the QSA check needs", () => {
    expect(Object.keys(validateRevendedorSignup(createEmptyRevendedorSignup())).sort()).toEqual(
      [
        "birthDate",
        "cnpj",
        "cpf",
        "email",
        "firstName",
        "hasSoldPapelito",
        "instagram",
        "lastName",
        "phone",
        "storeName",
      ].sort(),
    );
  });

  it("rejects an Instagram handle the WordPress would refuse", () => {
    expect(validateRevendedorSignup({ ...valid, instagram: "loja-centro" }).instagram).toBe(
      "Use só letras, números, ponto e sublinhado, com até 30 caracteres.",
    );
  });

  it("masks CPF and the store fields as the user types", () => {
    const empty = createEmptyRevendedorSignup();

    expect(patchRevendedorSignupField(empty, "cpf", "12345678909").cpf).toBe("123.456.789-09");
    expect(patchRevendedorSignupField(empty, "cnpj", "65326368000190").cnpj).toBe("65.326.368/0001-90");
    expect(patchRevendedorSignupField(empty, "instagram", "@loja").instagram).toBe("loja");
  });

  it("puts the full name error returned by step 2 on the first name field", () => {
    expect(revendedorErrorsFromStep1({ name: "Informe nome e sobrenome.", cpf: "CPF inválido." })).toEqual({
      cpf: "CPF inválido.",
      firstName: "Informe nome e sobrenome.",
    });
  });
});
