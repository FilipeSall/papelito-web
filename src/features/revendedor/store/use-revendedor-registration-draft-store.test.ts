import { describe, expect, it } from "vitest";

import { useRevendedorRegistrationDraftStore } from "./use-revendedor-registration-draft-store";

describe("useRevendedorRegistrationDraftStore", () => {
  it("patches and resets draft state", () => {
    useRevendedorRegistrationDraftStore.getState().patchStep1({
      storeName: "Loja Teste",
    });

    expect(useRevendedorRegistrationDraftStore.getState().draft.step1.storeName).toBe(
      "Loja Teste",
    );

    useRevendedorRegistrationDraftStore.getState().resetDraft();

    expect(useRevendedorRegistrationDraftStore.getState().draft.step1.storeName).toBe("");
  });

  it("rehydrates persisted draft with normalization and hydration flag", async () => {
    window.localStorage.setItem(
      "papelito:revendedor:cadastro-draft",
      JSON.stringify({
        state: {
          draft: {
            currentStep: 2,
            step1: {
              cnpj: "12345678000195",
              instagram: "@papelito",
            },
          },
        },
        version: 0,
      }),
    );

    await useRevendedorRegistrationDraftStore.persist.rehydrate();

    expect(useRevendedorRegistrationDraftStore.getState().hasHydrated).toBe(true);
    expect(useRevendedorRegistrationDraftStore.getState().draft.currentStep).toBe(2);
    expect(useRevendedorRegistrationDraftStore.getState().draft.step1.cnpj).toBe(
      "12.345.678/0001-95",
    );
    expect(useRevendedorRegistrationDraftStore.getState().draft.step1.instagram).toBe(
      "papelito",
    );
  });
});
