"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

function normalizeRole(role: unknown) {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

export function useAuthSession() {
  const { data: session, status } = useSession();
  const authError =
    typeof session?.authError === "string" ? session.authError : undefined;
  const authIdentityError = session?.authIdentityError === true;
  const role = useMemo(
    () => (authIdentityError ? undefined : normalizeRole(session?.role)),
    [authIdentityError, session?.role],
  );
  const identityIsValid = !authIdentityError;
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
    isAdministrator:
      identityIsValid &&
      (session?.b2b?.isInternalAdmin === true || role === "administrator"),
    isSeller:
      identityIsValid && (session?.b2b?.isVendor === true || role === "seller"),
    b2b: session?.b2b,
    isLegacyMigrationVisible:
      session?.b2b?.isLegacyCohort === true &&
      session.b2b.isB2bCohort !== true &&
      session.b2b.legacyMigrationStatus !== "migrated" &&
      session.b2b.legacyMigrationStatus !== "exempt",
    isB2bPurchaseBlocked:
      session?.b2b?.hasCustomerContext === true &&
      session.b2b.canPurchase !== true,
    isNotBuyer: session?.b2b?.purchaseMode === "not_buyer",
  };
}
