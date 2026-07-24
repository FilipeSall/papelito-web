"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export function useAuthSession() {
  const { data: session, status } = useSession();
  const authError = typeof session?.authError === "string" ? session.authError : undefined;
  const authIdentityError = session?.authIdentityError === true;
  const role = useMemo(
    () => (authIdentityError ? undefined : normalizeRole(session?.role)),
    [authIdentityError, session?.role],
  );
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
    authIdentityError,
    hasSession: status === "authenticated",
    isAuthenticated: hasAccessToken,
    hasAccessToken,
    isApiAuthenticated: hasAccessToken,
    isLoading: status === "loading",
    isRoleLoading: hasAccessToken && role === undefined && !authIdentityError,
    requiresReauth: status === "authenticated" && !hasAccessToken,
    isAdministrator: role === "administrator",
    isSeller: role === "seller",
		b2b: session?.b2b,
		isB2bPurchaseBlocked:
			session?.b2b?.isB2bCohort === true && session.b2b.canPurchase !== true,
  };
}
