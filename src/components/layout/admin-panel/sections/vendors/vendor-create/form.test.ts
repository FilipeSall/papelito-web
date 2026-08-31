import { describe, expect, it } from "vitest";

import {
  buildVendorCreatePayload,
  createInitialVendorCreateForm,
  createVendorCreateFormFromSourceUser,
  getDocumentError,
  validateVendorCreateForm,
} from "./form";

describe("vendor create form", () => {
  it("prefills the account, store and legal representative from a source user", () => {
    const form = createVendorCreateFormFromSourceUser({
      id: 42,
      name: "Ana Souza",
      firstName: "Ana",
      lastName: "Souza",
      email: "ana@example.com",
      storeName: "Papelaria Ana",
      cnpj: "65.326.368/0001-90",
      phoneNumber: "11999999999",
      instagram: "@ana",
      cep: "01310-930",
      street: "Avenida Paulista",
      number: "1000",
      complement: "Sala 2",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    });

    expect(form.sourceUserId).toBe(42);
    expect(form.bankAccount).toMatchObject({
      holderDocument: "65.326.368/0001-90",
      holderName: "Papelaria Ana",
    });
    expect(form.pagarmeDraft.managingPartners[0]).toMatchObject({
      email: "ana@example.com",
      name: "Ana Souza",
    });
  });

  it("normalizes the vendor payload without changing the temporary password", () => {
    const form = createInitialVendorCreateForm();
    Object.assign(form, {
      email: " vendor@example.com ",
      temporaryPassword: " senha com espaços ",
      storeName: " Papelaria ",
      cnpj: "65.326.368/0001-90",
      cep: "01310-930",
      street: " Avenida Paulista ",
      number: " 1000 ",
      neighborhood: " Bela Vista ",
      city: " São Paulo ",
      state: " SP ",
      coverageRanges: [{ minCep: "01000-000 ", maxCep: " 02000-000" }],
    });

    const payload = buildVendorCreatePayload(form);

    expect(payload).toMatchObject({
      email: "vendor@example.com",
      temporaryPassword: " senha com espaços ",
      storeName: "Papelaria",
      coverageRanges: [{ minCep: "01000-000", maxCep: "02000-000" }],
    });
  });

  it("keeps incomplete documents neutral and reports an invalid completed CNPJ", () => {
    expect(getDocumentError("65.326.368", "cnpj")).toBeUndefined();
    expect(getDocumentError("65.326.368/0001-91", "cnpj")).toContain("dígitos verificadores");
  });

  it("preserves the existing required-field validation order", () => {
    expect(validateVendorCreateForm(createInitialVendorCreateForm())).toBe("Informe um e-mail válido.");
  });
});
