"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type {
  VendorRegistrationDraft,
  VendorRegistrationStep1Data,
  VendorRegistrationStep2Data,
  VendorRegistrationStep3Data,
} from "../types/revendedor-application";
import {
  REVENDEDOR_REGISTRATION_STORAGE_KEY,
  createEmptyVendorRegistrationDraft,
  mergeVendorDraft,
  normalizeDraft,
} from "../utils/revendedor-registration";

type RevendedorRegistrationDraftState = {
  draft: VendorRegistrationDraft;
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  patchStep1: (values: Partial<VendorRegistrationStep1Data>) => void;
  patchStep2: (values: Partial<VendorRegistrationStep2Data>) => void;
  patchStep3: (values: Partial<VendorRegistrationStep3Data>) => void;
  replaceDraft: (draft: VendorRegistrationDraft) => void;
  mergeDraft: (draft: Partial<VendorRegistrationDraft>) => void;
  resetDraft: () => void;
};

function touchDraft(draft: VendorRegistrationDraft): VendorRegistrationDraft {
  return {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
}

function isSameValue<T>(current: T, next: T) {
  return JSON.stringify(current) === JSON.stringify(next);
}

export const useRevendedorRegistrationDraftStore =
  create<RevendedorRegistrationDraftState>()(
    persist(
      (set) => ({
        draft: createEmptyVendorRegistrationDraft(),
        hasHydrated: false,
        setHasHydrated: (value) => set({ hasHydrated: value }),
        setCurrentStep: (step) =>
          set((state) => {
            if (state.draft.currentStep === step) {
              return state;
            }

            return {
              draft: touchDraft({
                ...state.draft,
                currentStep: step,
              }),
            };
          }),
        patchStep1: (values) =>
          set((state) => {
            const nextStep1 = {
              ...state.draft.step1,
              ...values,
            };

            if (isSameValue(state.draft.step1, nextStep1)) {
              return state;
            }

            return {
              draft: touchDraft({
                ...state.draft,
                step1: nextStep1,
              }),
            };
          }),
        patchStep2: (values) =>
          set((state) => {
            const nextStep2 = {
              ...state.draft.step2,
              ...values,
            };

            if (isSameValue(state.draft.step2, nextStep2)) {
              return state;
            }

            return {
              draft: touchDraft({
                ...state.draft,
                step2: nextStep2,
              }),
            };
          }),
        patchStep3: (values) =>
          set((state) => {
            const nextStep3 = normalizeDraft({
              ...state.draft,
              step3: {
                ...state.draft.step3,
                ...values,
              },
            }).step3;

            if (isSameValue(state.draft.step3, nextStep3)) {
              return state;
            }

            return {
              draft: touchDraft({
                ...state.draft,
                step3: nextStep3,
              }),
            };
          }),
        replaceDraft: (draft) =>
          set({
            draft: touchDraft(normalizeDraft(draft)),
          }),
        mergeDraft: (draft) =>
          set((state) => {
            const nextDraft = mergeVendorDraft(state.draft, draft);

            if (isSameValue(state.draft, nextDraft)) {
              return state;
            }

            return {
              draft: touchDraft(nextDraft),
            };
          }),
        resetDraft: () =>
          set({
            draft: createEmptyVendorRegistrationDraft(),
          }),
      }),
      {
        name: REVENDEDOR_REGISTRATION_STORAGE_KEY,
        version: 1,
        storage:
          typeof window !== "undefined"
            ? createJSONStorage(() => window.localStorage)
            : undefined,
        partialize: (state) => ({
          draft: state.draft,
        }),
        migrate: (persistedState) => {
          if (!persistedState || typeof persistedState !== "object") {
            return {
              draft: createEmptyVendorRegistrationDraft(),
            };
          }

          const state = persistedState as { draft?: Partial<VendorRegistrationDraft> };

          return {
            draft: normalizeDraft(state.draft),
          };
        },
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      },
    ),
  );
