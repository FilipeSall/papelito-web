import { describe, expect, it } from "vitest";

import type { VendorPendingRegistrationResponse } from "@/features/revendedor/types/revendedor-application";

import type { VendorFormValues } from "./types";
import {
  buildVendorCreatePayload,
  buildVendorRegistrationPayload,
  createEmptyVendorFormValues,
  createVendorFormValuesFromRegistration,
  createVendorFormValuesFromSourceUser,
  getDocumentError,
  getInvalidVendorPendingFields,
  validateVendorFormValues,
} from "./vendor-form-values";

function registrationFixture(): VendorPendingRegistrationResponse {
  return {
    application: {
      coverageRanges: [{ minCep: "01000000", maxCep: "02000000" }],
      step1: {
        cnpj: "65.326.368/0001-90",
        discoveryChannel: "Instagram",
        email: "ana@example.com",
        firstName: "Ana",
        hasSoldPapelito: "sim",
        instagram: "ana",
        lastName: "Souza",
        phone: "11999999999",
        storeName: "Papelaria Ana",
      },
      step2: {
        cep: "01310-930",
        city: "São Paulo",
        complement: "Sala 2",
        coverageRanges: [],
        maxCep: "02000-000",
        minCep: "01000-000",
        neighborhood: "Bela Vista",
        number: "1000",
        state: "SP",
        street: "Avenida Paulista",
      },
    },
    draft: {
      annualRevenue: "250000",
      bankAccount: {
        accountCheckDigit: "7",
        accountNumber: "123456",
        bankCode: "260",
        branchCheckDigit: "",
        branchNumber: "1",
        holderDocument: "65.326.368/0001-90",
        holderName: "Papelaria Ana",
        holderType: "company",
        type: "checking",
      },
      companyName: "Papelaria Ana LTDA",
      corporationType: "MEI",
      corporationTypeOther: "",
      corporationTypeSelection: "MEI",
      foundingDate: "2020-01-15",
      hasManagingPartner: "yes",
      managingPartners: [
        {
          address: {
            city: "São Paulo",
            complement: "",
            neighborhood: "Bela Vista",
            state: "SP",
            street: "Avenida Paulista",
            streetNumber: "1000",
            zipCode: "01310-930",
          },
          birthdate: "1990-05-04",
          document: "111.444.777-35",
          email: "ana@example.com",
          monthlyIncome: "9000",
          motherName: "Maria Souza",
          name: "Ana Souza",
          professionalOccupation: "Empresária",
          selfDeclaredLegalRepresentative: true,
        },
      ],
      tradingName: "Papelaria Ana",
      transfer: { day: 0, interval: "Daily" },
    },
    pendingFields: [],
    updatedAt: "2026-09-01 10:00:00",
  };
}

function completeValues(): VendorFormValues {
  return createVendorFormValuesFromRegistration(registrationFixture());
}

describe("createVendorFormValuesFromSourceUser", () => {
  it("prefills the account, store and legal representative from a source user", () => {
    const values = createVendorFormValuesFromSourceUser({
      cep: "01310-930",
      city: "São Paulo",
      cnpj: "65.326.368/0001-90",
      complement: "Sala 2",
      email: "ana@example.com",
      firstName: "Ana",
      id: 42,
      instagram: "@ana",
      lastName: "Souza",
      name: "Ana Souza",
      neighborhood: "Bela Vista",
      number: "1000",
      phoneNumber: "11999999999",
      state: "SP",
      storeName: "Papelaria Ana",
      street: "Avenida Paulista",
    });

    expect(values.sourceUserId).toBe(42);
    expect(values.bankAccount).toMatchObject({
      holderDocument: "65.326.368/0001-90",
      holderName: "Papelaria Ana",
    });
    expect(values.pagarmeDraft.managingPartners[0]).toMatchObject({
      email: "ana@example.com",
      name: "Ana Souza",
    });
  });
});

describe("createVendorFormValuesFromRegistration", () => {
  it("hydrates every editable block from the stored registration", () => {
    const values = completeValues();

    expect(values).toMatchObject({
      cep: "01310-930",
      city: "São Paulo",
      cnpj: "65.326.368/0001-90",
      complement: "Sala 2",
      discoveryChannel: "Instagram",
      email: "ana@example.com",
      firstName: "Ana",
      hasSoldPapelito: "sim",
      instagram: "ana",
      lastName: "Souza",
      neighborhood: "Bela Vista",
      number: "1000",
      phoneNumber: "(11) 99999-9999",
      state: "SP",
      storeName: "Papelaria Ana",
      street: "Avenida Paulista",
    });
    expect(values.coverageRanges).toEqual([{ maxCep: "02000-000", minCep: "01000-000" }]);
    expect(values.pagarmeDraft.companyName).toBe("Papelaria Ana LTDA");
    expect(values.bankAccount.accountNumber).toBe("123456");
  });

  it("never carries a temporary password or a source user into an edit", () => {
    const values = completeValues();

    expect(values.temporaryPassword).toBe("");
    expect(values.sourceUserId).toBeUndefined();
  });

  it("falls back to a single empty coverage range when nothing is stored", () => {
    const registration = registrationFixture();
    const values = createVendorFormValuesFromRegistration({
      ...registration,
      application: {
        ...registration.application!,
        coverageRanges: [],
        step2: { ...registration.application!.step2, maxCep: "", minCep: "" },
      },
    });

    expect(values.coverageRanges).toEqual([{ maxCep: "", minCep: "" }]);
  });
});

describe("buildVendorRegistrationPayload", () => {
  it("round-trips the loaded registration so untouched fields keep their value", () => {
    const payload = buildVendorRegistrationPayload(completeValues());

    expect(payload.application.step1).toMatchObject({
      cnpj: "65.326.368/0001-90",
      discoveryChannel: "Instagram",
      email: "ana@example.com",
      hasSoldPapelito: "sim",
      instagram: "ana",
      storeName: "Papelaria Ana",
    });
    expect(payload.application.step2).toMatchObject({
      complement: "Sala 2",
      neighborhood: "Bela Vista",
      number: "1000",
      street: "Avenida Paulista",
    });
    expect(payload.draft.managingPartners[0]).toMatchObject({
      document: "111.444.777-35",
      motherName: "Maria Souza",
      professionalOccupation: "Empresária",
    });
    expect(payload.draft.bankAccount).toMatchObject({
      accountNumber: "123456",
      bankCode: "260",
    });
  });

  it("carries a single changed field while leaving the rest intact", () => {
    const values = completeValues();
    const payload = buildVendorRegistrationPayload({ ...values, storeName: "Papelaria Nova" });

    expect(payload.application.step1.storeName).toBe("Papelaria Nova");
    expect(payload.application.step1.cnpj).toBe("65.326.368/0001-90");
    expect(payload.draft.bankAccount.accountNumber).toBe("123456");
    expect(payload.application.coverageRanges).toEqual([
      { maxCep: "02000-000", minCep: "01000-000" },
    ]);
  });

  it("keeps protected account fields out of the update payload", () => {
    const values = completeValues();
    const payload = buildVendorRegistrationPayload({
      ...values,
      sourceUserId: 99,
      temporaryPassword: "nao-deve-ir",
    });

    expect(Object.keys(payload)).toEqual(["application", "draft"]);
    expect(JSON.stringify(payload)).not.toContain("nao-deve-ir");
    expect(JSON.stringify(payload)).not.toContain("sourceUserId");
  });

  it("mirrors the first coverage range into the legacy step2 fields", () => {
    const values = completeValues();
    const payload = buildVendorRegistrationPayload({
      ...values,
      coverageRanges: [
        { maxCep: "04000-000", minCep: "03000-000" },
        { maxCep: "06000-000", minCep: "05000-000" },
      ],
    });

    expect(payload.application.step2.minCep).toBe("03000-000");
    expect(payload.application.step2.maxCep).toBe("04000-000");
    expect(payload.application.coverageRanges).toHaveLength(2);
  });
});

describe("buildVendorCreatePayload", () => {
  it("normalizes the vendor payload without changing the temporary password", () => {
    const payload = buildVendorCreatePayload({
      ...createEmptyVendorFormValues(),
      cep: "01310-930",
      city: " São Paulo ",
      cnpj: "65.326.368/0001-90",
      coverageRanges: [{ minCep: "01000-000 ", maxCep: " 02000-000" }],
      email: " vendor@example.com ",
      neighborhood: " Bela Vista ",
      number: " 1000 ",
      state: " SP ",
      storeName: " Papelaria ",
      street: " Avenida Paulista ",
      temporaryPassword: " senha com espaços ",
    });

    expect(payload).toMatchObject({
      coverageRanges: [{ minCep: "01000-000", maxCep: "02000-000" }],
      email: "vendor@example.com",
      storeName: "Papelaria",
      temporaryPassword: " senha com espaços ",
    });
  });
});

describe("getDocumentError", () => {
  it("keeps incomplete documents neutral and reports an invalid completed CNPJ", () => {
    expect(getDocumentError("65.326.368", "cnpj")).toBeUndefined();
    expect(getDocumentError("65.326.368/0001-91", "cnpj")).toContain("dígitos verificadores");
  });
});

describe("getInvalidVendorPendingFields", () => {
  function withPartner(
    values: VendorFormValues,
    patch: Partial<VendorFormValues["pagarmeDraft"]["managingPartners"][number]>,
  ): VendorFormValues {
    const partner = values.pagarmeDraft.managingPartners[0];

    return {
      ...values,
      pagarmeDraft: { ...values.pagarmeDraft, managingPartners: [{ ...partner, ...patch }] },
    };
  }

  it("reports nothing when every pending-tracked field already satisfies its rule", () => {
    expect(getInvalidVendorPendingFields(completeValues())).toEqual([]);
  });

  it("keeps a partially typed CPF invalid and releases it once the check digits match", () => {
    expect(
      getInvalidVendorPendingFields(withPartner(completeValues(), { document: "037.122" })),
    ).toEqual(["partner.document"]);
    expect(
      getInvalidVendorPendingFields(withPartner(completeValues(), { document: "037.122.851-40" })),
    ).toEqual([]);
  });

  it("flags each broken field independently", () => {
    const values = withPartner(
      { ...completeValues(), phoneNumber: "" },
      { birthdate: "", monthlyIncome: "0", professionalOccupation: "   " },
    );

    expect(getInvalidVendorPendingFields(values)).toEqual([
      "phoneNumber",
      "partner.birthdate",
      "partner.monthlyIncome",
      "partner.professionalOccupation",
    ]);
  });

  it("validates the bank holder document against the selected holder type", () => {
    const values = completeValues();

    expect(
      getInvalidVendorPendingFields({
        ...values,
        bankAccount: { ...values.bankAccount, holderType: "individual" },
      }),
    ).toEqual(["bankAccount.holderDocument"]);
  });

  it("flags a company account registered under a CNPJ other than the vendor's", () => {
    const values = completeValues();

    expect(
      getInvalidVendorPendingFields({
        ...values,
        bankAccount: { ...values.bankAccount, holderDocument: "11.444.777/0001-61" },
      }),
    ).toEqual(["bankAccount.holderDocument"]);
  });
});

describe("validateVendorFormValues", () => {
  it("preserves the existing required-field validation order", () => {
    expect(validateVendorFormValues(createEmptyVendorFormValues(), "admin-create")).toBe(
      "Informe um e-mail válido.",
    );
  });

  it("requires a temporary password only when creating a brand new account", () => {
    const values = { ...createEmptyVendorFormValues(), email: "vendor@example.com" };

    expect(validateVendorFormValues(values, "admin-create")).toBe(
      "Informe uma senha temporária para o vendor.",
    );
    expect(validateVendorFormValues(values, "admin-edit")).toBe("Informe o nome da loja.");
    expect(validateVendorFormValues(values, "vendor-self")).toBe("Informe o nome da loja.");
  });

  it("rejects a repeated-digit phone before creating a vendor", () => {
    expect(
      validateVendorFormValues(
        {
          ...createEmptyVendorFormValues(),
          cnpj: "65.326.368/0001-90",
          email: "vendor@example.com",
          phoneNumber: "0000000000",
          storeName: "Papelaria Ana",
          temporaryPassword: "senha temporaria",
        },
        "admin-create",
      ),
    ).toBe("Informe um telefone com DDD.");
  });

  it("accepts an admin edit whose optional KYC blocks are still empty", () => {
    const values = completeValues();

    expect(
      validateVendorFormValues(
        {
          ...values,
          bankAccount: { ...values.bankAccount, accountNumber: "", bankCode: "" },
          pagarmeDraft: { ...values.pagarmeDraft, annualRevenue: "", companyName: "" },
        },
        "admin-edit",
      ),
    ).toBeNull();
  });

  it("still blocks an admin edit that empties a core store field", () => {
    expect(validateVendorFormValues({ ...completeValues(), city: "" }, "admin-edit")).toBe(
      "Informe a cidade da loja.",
    );
  });
});
