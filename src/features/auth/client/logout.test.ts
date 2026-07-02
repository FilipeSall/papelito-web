import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearSessionClientState, signOutAndClearSession } from "./logout";

const clearStoreMock = vi.fn();
const mutateMock = vi.fn();
const resetCheckoutMock = vi.fn();
const clearCheckoutStorageMock = vi.fn();
const signOutMock = vi.fn();

vi.mock("@/lib/apollo/client", () => ({
  apolloClient: {
    clearStore: () => clearStoreMock(),
  },
}));

vi.mock("swr", () => ({
  mutate: (...args: unknown[]) => mutateMock(...args),
}));

vi.mock("@/features/checkout/store/use-checkout-store", () => ({
  useCheckoutStore: {
    getState: () => ({
      resetCheckout: resetCheckoutMock,
    }),
    persist: {
      clearStorage: clearCheckoutStorageMock,
    },
  },
}));

vi.mock("next-auth/react", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

describe("logout client cleanup", () => {
  beforeEach(() => {
    clearStoreMock.mockReset();
    mutateMock.mockReset();
    resetCheckoutMock.mockReset();
    clearCheckoutStorageMock.mockReset();
    signOutMock.mockReset();
    clearStoreMock.mockResolvedValue(undefined);
    mutateMock.mockResolvedValue(undefined);
    signOutMock.mockResolvedValue(undefined);
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
    expect(resetCheckoutMock).toHaveBeenCalledOnce();
    expect(clearCheckoutStorageMock).toHaveBeenCalledOnce();
    expect(clearStoreMock).toHaveBeenCalledOnce();
    expect(mutateMock).toHaveBeenCalledWith(expect.any(Function), undefined, {
      revalidate: false,
    });
  });

  it("clears client state before signing out", async () => {
    await signOutAndClearSession({ callbackUrl: "/entrar", redirect: false });

    expect(signOutMock).toHaveBeenCalledWith({
      callbackUrl: "/entrar",
      redirect: false,
    });
    expect(clearStoreMock).toHaveBeenCalled();
    expect(mutateMock).toHaveBeenCalled();
  });
});
