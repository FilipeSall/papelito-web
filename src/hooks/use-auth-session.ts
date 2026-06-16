"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export function useAuthSession() {
  const { data: session, status } = useSession();
  const role = useMemo(() => normalizeRole(session?.role), [session?.role]);
  const authError = typeof session?.authError === "string" ? session.authError : undefined;
  const hasAccessToken =
    status === "authenticated" &&
    typeof session?.accessToken === "string" &&
    session.accessToken.length > 0 &&
    authError === undefined;

  return {
    session,
    status,
    role,
    authError,
    hasSession: status === "authenticated",
    isAuthenticated: hasAccessToken,
    hasAccessToken,
    isApiAuthenticated: hasAccessToken,
    isLoading: status === "loading",
    isRoleLoading: hasAccessToken && role === undefined,
    requiresReauth: status === "authenticated" && !hasAccessToken,
    isAdministrator: role === "administrator",
    isSeller: role === "seller",
  };
}
