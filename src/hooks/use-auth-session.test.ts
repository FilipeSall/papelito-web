import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { buildSession } from "../../test/factories/session";
import { useAuthSession } from "./use-auth-session";

const useSessionMock = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

describe("useAuthSession", () => {
  it("derives authenticated customer flags from the session", () => {
    useSessionMock.mockReturnValue({
      data: buildSession({ role: " Customer " }),
      status: "authenticated",
    });

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.role).toBe("customer");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.hasSession).toBe(true);
    expect(result.current.hasAccessToken).toBe(true);
    expect(result.current.isApiAuthenticated).toBe(true);
  });

  it("flags missing access token as reauth required", () => {
    useSessionMock.mockReturnValue({
      data: buildSession({ accessToken: undefined }),
      status: "authenticated",
    });

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.requiresReauth).toBe(true);
    expect(result.current.isApiAuthenticated).toBe(false);
  });

  it("treats auth errors as an unauthenticated API session", () => {
    useSessionMock.mockReturnValue({
      data: buildSession({ authError: "invalid_refresh_token" }),
      status: "authenticated",
    });

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.authError).toBe("invalid_refresh_token");
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.requiresReauth).toBe(true);
  });

  it("identifies seller and administrator roles", () => {
    useSessionMock.mockReturnValue({
      data: buildSession({ role: "seller" }),
      status: "authenticated",
    });

    const sellerHook = renderHook(() => useAuthSession());
    expect(sellerHook.result.current.isSeller).toBe(true);

    useSessionMock.mockReturnValue({
      data: buildSession({ role: "administrator" }),
      status: "authenticated",
    });

    const adminHook = renderHook(() => useAuthSession());
    expect(adminHook.result.current.isAdministrator).toBe(true);
  });

  it("does not expose privileged roles when identity validation failed", () => {
    useSessionMock.mockReturnValue({
      data: buildSession({ authIdentityError: true, role: "administrator" }),
      status: "authenticated",
    });

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.authIdentityError).toBe(true);
    expect(result.current.role).toBeUndefined();
    expect(result.current.isAdministrator).toBe(false);
    expect(result.current.isRoleLoading).toBe(false);
  });

  it("does not trust a stale privileged B2B context after identity validation failed", () => {
    useSessionMock.mockReturnValue({
      data: buildSession({
        authIdentityError: true,
        b2b: { isInternalAdmin: true, isVendor: true },
        role: "customer",
      }),
      status: "authenticated",
    });

    const { result } = renderHook(() => useAuthSession());

    expect(result.current.isAdministrator).toBe(false);
    expect(result.current.isSeller).toBe(false);
  });
});
