import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearSessionClientState, signOutAndClearSession } from "./logout";

const mocks = vi.hoisted(() => ({
  clearStore: vi.fn(),
  mutate: vi.fn(),
  resetCheckout: vi.fn(),
  clearCheckoutStorage: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/lib/apollo/client", () => ({
  apolloClient: {
    clearStore: () => mocks.clearStore(),
  },
}));

vi.mock("swr", () => ({
  mutate: (...args: unknown[]) => mocks.mutate(...args),
}));

vi.mock("@/features/checkout/store/use-checkout-store", () => ({
  useCheckoutStore: {
    getState: () => ({
      resetCheckout: mocks.resetCheckout,
    }),
    persist: {
      clearStorage: mocks.clearCheckoutStorage,
    },
  },
}));

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => mocks.signOut(...args),
}));

describe("logout client cleanup", () => {
  beforeEach(() => {
    mocks.clearStore.mockReset();
    mocks.mutate.mockReset();
    mocks.resetCheckout.mockReset();
    mocks.clearCheckoutStorage.mockReset();
    mocks.signOut.mockReset();
    mocks.clearStore.mockResolvedValue(undefined);
    mocks.mutate.mockResolvedValue(undefined);
    mocks.signOut.mockResolvedValue(undefined);
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("clears auth-related client state and per-account storage", async () => {
    window.localStorage.setItem("papelito-checkout-store", "checkout");
    window.localStorage.setItem("papelito:revendedor:cadastro-draft", "draft");
    window.localStorage.setItem("papelito:catalog-availability:v3:1,2", "availability");
    window.localStorage.setItem("papelito-cart-store", "cart");
    window.sessionStorage.setItem("papelito:coverage-warning-shown", "1");
    window.sessionStorage.setItem("papelito:missing-cep-modal:dismissed:42", "1");
    window.sessionStorage.setItem("papelito:cadastro:step1", "draft");

    await clearSessionClientState();

    expect(window.localStorage.getItem("papelito-checkout-store")).toBeNull();
    expect(window.localStorage.getItem("papelito:revendedor:cadastro-draft")).toBeNull();
    expect(window.localStorage.getItem("papelito:catalog-availability:v3:1,2")).toBeNull();
    expect(window.localStorage.getItem("papelito-cart-store")).toBe("cart");
    expect(window.sessionStorage.getItem("papelito:coverage-warning-shown")).toBeNull();
    expect(window.sessionStorage.getItem("papelito:missing-cep-modal:dismissed:42")).toBeNull();
    expect(window.sessionStorage.getItem("papelito:cadastro:step1")).toBe("draft");
    expect(mocks.resetCheckout).toHaveBeenCalledOnce();
    expect(mocks.clearCheckoutStorage).toHaveBeenCalledOnce();
    expect(mocks.clearStore).toHaveBeenCalledOnce();
    expect(mocks.mutate).toHaveBeenCalledWith(expect.any(Function), undefined, {
      revalidate: false,
    });
  });

  it("clears client state before signing out", async () => {
    await signOutAndClearSession({ callbackUrl: "/entrar", redirect: false });

    expect(mocks.signOut).toHaveBeenCalledWith({
      callbackUrl: "/entrar",
      redirect: false,
    });
    expect(mocks.clearStore).toHaveBeenCalled();
    expect(mocks.mutate).toHaveBeenCalled();
  });
});
