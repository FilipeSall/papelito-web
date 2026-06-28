import { describe, expect, it } from "vitest";

import type { ProfileCustomer } from "@/features/profile/types/profile-customer";
import {
  buildDraftFromSources,
  buildRevendedorSubmitPayload,
  createEmptyVendorRegistrationDraft,
  normalizeDraft,
  validateStep2,
} from "./revendedor-registration";

describe("revendedor-registration", () => {
  it("normalizes stored draft values", () => {
    const draft = normalizeDraft({
      currentStep: 2,
      step1: {
        storeName: "",
        firstName: "",
        lastName: "",
        cnpj: "12345678000195",
        email: "",
        phone: "11987654321",
        instagram: "@papelito",
        hasSoldPapelito: "",
        discoveryChannel: "",
      },
      step2: {
        cep: "01310930",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        minCep: "01001000",
        maxCep: "02020000",
        coverageRanges: [{ minCep: "01001000", maxCep: "02020000" }],
        state: "sp",
      },
    });

    expect(draft.currentStep).toBe(2);
    expect(draft.step1.cnpj).toBe("12.345.678/0001-95");
    expect(draft.step1.phone).toBe("(11) 98765-4321");
    expect(draft.step1.instagram).toBe("papelito");
    expect(draft.step2.cep).toBe("01310-930");
    expect(draft.step2.state).toBe("SP");
  });

  it("builds a draft from customer and application defaults", () => {
    const customer: ProfileCustomer = {
      firstName: "Maria",
      lastName: "Silva",
      email: "maria@papelito.com",
      displayName: "Maria Silva",
      role: "customer",
      meta: {
        storeName: "Loja Maria",
        phoneNumber: "11987654321",
        cnpj: "12345678000195",
        cpf: "",
        instagram: "@lojadamaria",
        state: "SP",
        city: "Sao Paulo",
        cep: "01310930",
      },
      preferences: {
        favoritePromotionEmailEnabled: false,
      },
      billing: {
        firstName: "Maria",
        lastName: "Silva",
        company: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        postcode: "",
        country: "BR",
        email: "maria@papelito.com",
        phone: "11987654321",
      },
      shipping: {
        firstName: "",
        lastName: "",
        company: "",
        address1: "",
        address2: "",
        city: "",
        state: "",
        postcode: "",
        country: "BR",
        email: "",
        phone: "",
      },
    };

    const draft = buildDraftFromSources(customer, null);

    expect(draft.step1.storeName).toBe("Loja Maria");
    expect(draft.step2.cep).toBe("01310-930");
    expect(draft.step3.companyName).toBe("Loja Maria");
    expect(draft.step3.bankAccount.holderDocument).toBe("12.345.678/0001-95");
  });

  it("validates min and max cep ranges", () => {
    const draft = createEmptyVendorRegistrationDraft();
    draft.step2.minCep = "03000-000";
    draft.step2.maxCep = "02000-000";

    expect(validateStep2(draft.step2)).toMatchObject({
      street: "Informe o logradouro.",
      number: "Informe o número.",
      neighborhood: "Informe o bairro.",
      city: "Informe a cidade.",
      state: "Selecione o estado.",
      cep: "Informe um CEP de operação válido.",
      maxCep: "O CEP final precisa ser maior ou igual ao CEP inicial.",
    });
  });

  it("builds a normalized submit payload", () => {
    const draft = createEmptyVendorRegistrationDraft();
    draft.step1.storeName = " Loja Papelito ";
    draft.step1.firstName = " Ana ";
    draft.step1.lastName = " Souza ";
    draft.step1.cnpj = "12345678000195";
    draft.step1.phone = "11987654321";
    draft.step1.email = "ana@papelito.com";
    draft.step1.instagram = "@ana";
    draft.step1.hasSoldPapelito = "sim";
    draft.step2.cep = "01310930";
    draft.step2.street = "Rua A";
    draft.step2.number = "10";
    draft.step2.neighborhood = "Centro";
    draft.step2.city = "Sao Paulo";
    draft.step2.state = "sp";
    draft.step2.minCep = "01001000";
    draft.step2.maxCep = "02002000";

    const payload = buildRevendedorSubmitPayload(draft);

    expect(payload.step1.cnpj).toBe("12.345.678/0001-95");
    expect(payload.step2.cep).toBe("01310-930");
    expect(payload.step2.state).toBe("SP");
  });
});
