"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export function useAuthSession() {
  const { data: session, status } = useSession();
  const role = useMemo(() => normalizeRole(session?.role), [session?.role]);

  return {
    session,
    status,
    role,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    isRoleLoading: status === "authenticated" && role === undefined,
    isAdministrator: role === "administrator",
  };
}
