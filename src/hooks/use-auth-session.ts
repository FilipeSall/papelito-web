"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export function useAuthSession() {
  const { data: session, status } = useSession();
  const role = useMemo(() => normalizeRole(session?.role), [session?.role]);
  const hasAccessToken =
    status === "authenticated" &&
    typeof session?.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session?.authError !== "string";

  return {
    session,
    status,
    role,
    isAuthenticated: status === "authenticated",
    hasAccessToken,
    isApiAuthenticated: hasAccessToken,
    isLoading: status === "loading",
    isRoleLoading: status === "authenticated" && role === undefined,
    requiresReauth: status === "authenticated" && !hasAccessToken,
    isAdministrator: role === "administrator",
    isSeller: role === "seller",
  };
}
