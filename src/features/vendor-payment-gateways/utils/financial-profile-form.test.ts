import { describe, expect, it } from "vitest";

import type { FinancialProfile } from "../types/payment-gateways";
import {
  buildFinancialProfilePatch,
  createFinancialFormValues,
  validateFinancialForm,
  type FinancialFormValues,
} from "./financial-profile-form";

const STORE_CNPJ = "11.222.333/0001-81";
const VALID_CPF = "529.982.247-25";

function profile(overrides: Partial<FinancialProfile["profile"]> = {}): FinancialProfile {
  return {
    version: 4,
    cnpj: "",
    cnpjChanged: false,
    profile: {
      companyName: "Papelaria Exemplo LTDA",
      tradingName: "Papelaria Exemplo",
      corporationType: "MEI",
      foundingDate: "2020-01-01",
      annualRevenue: "120000",
      managingPartners: [
        {
          name: "Ana Souza",
          email: "ana@example.com",
          motherName: "Maria",
          monthlyIncome: "5000",
          professionalOccupation: "Empresária",
          hasDocument: true,
          documentLast4: "4725",
          hasBirthdate: true,
          selfDeclaredLegalRepresentative: false,
          address: {
            zipCode: "01310100",
            street: "Avenida Paulista",
            streetNumber: "1000",
            complement: "",
            neighborhood: "Bela Vista",
            city: "São Paulo",
            state: "SP",
          },
        },
      ],
      bankAccount: {
        holderName: "Papelaria Exemplo",
        holderType: "company",
        holderDocument: "11222333000181",
        bankCode: "341",
        branchNumber: "1234",
        branchCheckDigit: "",
        accountNumber: "56789",
        accountCheckDigit: "0",
        type: "checking",
      },
      ...overrides,
    },
    pending: { pagarme: { policy: "allowed", pendingFields: [] }, mercadopago: { pendingFields: [] } },
  };
}

function edit(values: FinancialFormValues, change: (draft: FinancialFormValues) => void): FinancialFormValues {
  const draft = structuredClone(values);
  change(draft);
  return draft;
}

const ALLOWED = { cnpj: STORE_CNPJ, pagarmeBlocked: false };
const BLOCKED = { cnpj: STORE_CNPJ, pagarmeBlocked: true };

describe("createFinancialFormValues", () => {
  it("nunca preenche CPF nem nascimento, que só existem como indicador", () => {
    const values = createFinancialFormValues(profile());

    expect(values.partner.document).toBe("");
    expect(values.partner.birthdate).toBe("");
    expect(values.partner.name).toBe("Ana Souza");
    expect(values.bankAccount.accountNumber).toBe("56789");
  });
});

describe("buildFinancialProfilePatch", () => {
  it("edição parcial envia só o campo alterado e não toca CPF, nascimento nem conta", () => {
    const initial = createFinancialFormValues(profile());
    const values = edit(initial, (draft) => {
      draft.tradingName = "Papelaria Nova";
    });

    const patch = buildFinancialProfilePatch(initial, values, ALLOWED);

    expect(patch.profile).toEqual({ tradingName: "Papelaria Nova" });
    expect(patch.sensitive).toBe(false);
    expect(JSON.stringify(patch.profile)).not.toMatch(/document|birthdate|bankAccount/);
  });

  it("CPF digitado vai só em dígitos e marca o envio como sensível", () => {
    const initial = createFinancialFormValues(profile());
    const values = edit(initial, (draft) => {
      draft.partner.document = VALID_CPF;
    });

    const patch = buildFinancialProfilePatch(initial, values, ALLOWED);

    expect(patch.profile).toEqual({ managingPartners: [{ document: "52998224725" }] });
    expect(patch.sensitive).toBe(true);
  });

  it("conta bancária vai inteira, sempre PJ no CNPJ da loja", () => {
    const initial = createFinancialFormValues(profile());
    const values = edit(initial, (draft) => {
      draft.bankAccount.accountNumber = "99999";
    });

    const patch = buildFinancialProfilePatch(initial, values, ALLOWED);

    expect(patch.sensitive).toBe(true);
    expect(patch.profile.bankAccount).toMatchObject({
      accountNumber: "99999",
      holderDocument: "11222333000181",
      holderType: "company",
    });
  });

  it("autodeclaração confirmada vai explicitamente como true", () => {
    const initial = createFinancialFormValues(profile());
    const values = edit(initial, (draft) => {
      draft.partner.selfDeclaredLegalRepresentative = true;
    });

    expect(buildFinancialProfilePatch(initial, values, ALLOWED).profile).toEqual({
      managingPartners: [{ selfDeclaredLegalRepresentative: true }],
    });
  });

  it("endereço do representante envia só a chave alterada", () => {
    const initial = createFinancialFormValues(profile());
    const values = edit(initial, (draft) => {
      draft.partner.address.streetNumber = "2000";
    });

    expect(buildFinancialProfilePatch(initial, values, ALLOWED).profile).toEqual({
      managingPartners: [{ address: { streetNumber: "2000" } }],
    });
  });

  it("com CNAE bloqueado, campos exclusivos da Pagar.me ficam fora do envio", () => {
    const initial = createFinancialFormValues(profile());
    const values = edit(initial, (draft) => {
      draft.companyName = "Tabacaria Exemplo LTDA";
      draft.annualRevenue = "1";
      draft.partner.document = VALID_CPF;
      draft.bankAccount.accountNumber = "1";
    });

    const patch = buildFinancialProfilePatch(initial, values, BLOCKED);

    expect(patch.profile).toEqual({ companyName: "Tabacaria Exemplo LTDA" });
    expect(patch.sensitive).toBe(false);
  });

  it("sem mudança nenhuma o patch é vazio", () => {
    const initial = createFinancialFormValues(profile());

    expect(buildFinancialProfilePatch(initial, initial, ALLOWED).empty).toBe(true);
  });
});

describe("validateFinancialForm", () => {
  const initial = createFinancialFormValues(profile());

  it("recusa CPF inválido ou mascarado e nascimento no futuro", () => {
    const masked = edit(initial, (draft) => {
      draft.partner.document = "***.***.***-25";
      draft.partner.birthdate = "2999-01-01";
    });
    const errors = validateFinancialForm(initial, masked, ALLOWED);

    expect(errors["partner.document"]).toBeDefined();
    expect(errors["partner.birthdate"]).toBeDefined();
  });

  it("não exige CPF quando o vendor não digitou um novo", () => {
    expect(validateFinancialForm(initial, initial, ALLOWED)).toEqual({});
  });

  it("valida a conta inteira quando ela muda, inclusive o limite do titular", () => {
    const values = edit(initial, (draft) => {
      draft.bankAccount.holderName = "Nome de titular comprido demais para a Pagar.me aceitar";
      draft.bankAccount.bankCode = "34";
    });
    const errors = validateFinancialForm(initial, values, ALLOWED);

    expect(errors["bankAccount.holderName"]).toMatch(/29/);
    expect(errors["bankAccount.bankCode"]).toBeDefined();
  });

  it("conta não fecha sem CNPJ válido da loja", () => {
    const values = edit(initial, (draft) => {
      draft.bankAccount.accountNumber = "123";
    });

    expect(validateFinancialForm(initial, values, { cnpj: "", pagarmeBlocked: false })["bankAccount.holderDocument"]).toBeDefined();
  });

  it("com CNAE bloqueado ignora os campos exclusivos da Pagar.me", () => {
    const values = edit(initial, (draft) => {
      draft.partner.document = "123";
      draft.bankAccount.bankCode = "1";
    });

    expect(validateFinancialForm(initial, values, BLOCKED)).toEqual({});
  });

  it("e-mail do representante alterado precisa ser válido", () => {
    const values = edit(initial, (draft) => {
      draft.partner.email = "ana@";
    });

    expect(validateFinancialForm(initial, values, ALLOWED)["partner.email"]).toBeDefined();
  });
});
