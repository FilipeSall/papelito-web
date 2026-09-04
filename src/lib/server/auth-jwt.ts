import "server-only";

import type { JWT } from "next-auth/jwt";

import { getWpGraphqlEndpoint } from "@/lib/server/env";
import { wpRest } from "@/lib/server/wp-rest";

const WP_REFRESH_TOKEN_MUTATION = `
  mutation Refresh($r: String!) {
    refreshJwtAuthToken(input: { jwtRefreshToken: $r }) {
      authToken
    }
  }
`;

const ROLE_REVALIDATE_INTERVAL_MS = 5 * 60 * 1000;
const ACCESS_TOKEN_REFRESH_SKEW_MS = 30_000;

type WpRefreshResponse = {
  authToken: string;
};

type WpRefreshGraphqlResponse = {
  data?: {
    refreshJwtAuthToken?: WpRefreshResponse | null;
  };
  errors?: Array<{ message?: string }>;
};

export type RefreshAuthTokenError =
  | "invalid_refresh_token"
  | "missing_refresh_token"
  | "token_refresh_failed";

type RefreshAuthTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; error: RefreshAuthTokenError };

export type WpAuthIdentityResponse = {
  user?: {
    role?: string | null;
    profileComplete?: boolean | null;
  } | null;
  b2b?: {
    isB2bCohort?: boolean;
    accountStatus?: string;
    accountStatusLabel?: string;
    accountSuspension?: {
      actorName?: string;
      actorUserId?: number;
      at?: string;
      reason?: string;
    } | null;
    canPurchase?: boolean;
    purchaseBlockReason?: string | null;
    requiresB2bOnboarding?: boolean;
    userContextType?: "internal_admin" | "vendor" | "customer" | "hybrid";
    isInternalAdmin?: boolean;
    isVendor?: boolean;
    hasCustomerContext?: boolean;
    requiresCustomerCpf?: boolean;
    companyId?: number | null;
    companyOwnershipStatus?: string | null;
    companyRegistryStatus?: string | null;
    companyStatus?: string | null;
    purchaseMode?: "b2b" | "not_buyer" | "blocked";
    isLegacyCohort?: boolean;
    legacyMigrationStatus?: string | null;
    legacyGraceEndsAt?: string | null;
    legacyWarningLevel?: "none" | "info" | "warning" | "urgent";
    legacyCanPurchaseDuringGrace?: boolean;
    identityStatus?: string;
    membershipRole?: string | null;
    membershipStatus?: string | null;
    onboardingStatus?: string;
    ownerApplication?: {
      applicationId: number;
      companyId: number;
      attemptNumber: number;
      status:
        | "document_required"
        | "pending_manual_review"
        | "auto_approved"
        | "approved"
        | "rejected";
      fileName: string | null;
      submittedAt: string | null;
      decidedAt: string | null;
      canUpload: boolean;
      canRestart: boolean;
    };
  } | null;
};

export type WpB2bContext = NonNullable<WpAuthIdentityResponse["b2b"]>;

export type WpAuthenticatedIdentity = {
  ok: boolean;
  profileComplete?: boolean;
  role?: string;
  b2b?: WpB2bContext;
};

type SignedInUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  accessToken?: string;
  accessTokenExpires?: number;
  refreshToken?: string;
  profileComplete?: boolean;
  role?: string;
  b2b?: WpB2bContext;
};

function normalizeRole(role: unknown): string | undefined {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

function shouldRevalidateRole(token: JWT): boolean {
  if (!token.role) {
    return true;
  }

  if (typeof token.roleCheckedAt !== "number") {
    return true;
  }

  return Date.now() - token.roleCheckedAt >= ROLE_REVALIDATE_INTERVAL_MS;
}

function getRefreshErrorCode(
  errors: Array<{ message?: string }> | undefined,
): RefreshAuthTokenError {
  const message = errors?.[0]?.message?.toLowerCase() ?? "";

  if (message.includes("refresh token") && message.includes("invalid")) {
    return "invalid_refresh_token";
  }

  return "token_refresh_failed";
}

async function wpRefreshAuthToken(refreshToken: string): Promise<RefreshAuthTokenResult> {
  try {
    const response = await fetch(getWpGraphqlEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: WP_REFRESH_TOKEN_MUTATION,
        variables: {
          r: refreshToken,
        },
      }),
    });

    const text = await response.text();
    let json: WpRefreshGraphqlResponse | null = null;

    if (text) {
      try {
        json = JSON.parse(text) as WpRefreshGraphqlResponse;
      } catch {
        console.error("[auth] JWT refresh returned non-JSON response", response.status);
        return { ok: false, error: "token_refresh_failed" };
      }
    }

    if (!response.ok || json?.errors?.length || !json?.data?.refreshJwtAuthToken?.authToken) {
      const errorCode = getRefreshErrorCode(json?.errors);
      const logger = errorCode === "invalid_refresh_token" ? console.warn : console.error;
      logger("[auth] JWT refresh failed", response.status, json?.errors);
      return { ok: false, error: errorCode };
    }

    return {
      ok: true,
      accessToken: json.data.refreshJwtAuthToken.authToken,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[auth] JWT refresh request failed", message);
    return { ok: false, error: "token_refresh_failed" };
  }
}

export async function wpFetchAuthenticatedIdentity(
  accessToken: string,
): Promise<WpAuthenticatedIdentity> {
  try {
    const identity = await wpRest<WpAuthIdentityResponse>("/papelito/v1/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (identity.ok) {
      return {
        ok: true,
        role: normalizeRole(identity.data.user?.role),
        profileComplete:
          typeof identity.data.user?.profileComplete === "boolean"
            ? identity.data.user.profileComplete
            : undefined,
        b2b: identity.data.b2b ?? undefined,
      };
    }

    console.error("[auth] identity lookup /auth/me failed", identity.status, identity.error);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    console.error("[auth] identity lookup /auth/me threw", message);
  }

  return { ok: false, role: undefined, b2b: undefined };
}

export function getAccessTokenExpiresAt(accessToken?: string) {
  if (!accessToken) {
    return undefined;
  }

  try {
    const [, payload] = accessToken.split(".");

    if (!payload) {
      return undefined;
    }

    const normalizedPayload = payload.replaceAll("-", "+").replaceAll("_", "/");
    const decodedPayload = JSON.parse(
      Buffer.from(normalizedPayload, "base64").toString("utf-8"),
    ) as { exp?: number };

    return typeof decodedPayload.exp === "number" ? decodedPayload.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

function clearInvalidAuthState(token: JWT, authError: RefreshAuthTokenError) {
  delete token.accessToken;
  delete token.accessTokenExpires;
  delete token.refreshToken;
  delete token.role;
  delete token.roleCheckedAt;
  delete token.authIdentityError;
  token.authError = authError;
}

function applyIdentityToToken(token: JWT, identity: WpAuthenticatedIdentity) {
  if (!identity.ok) {
    token.authIdentityError = true;
    return;
  }

  token.role = identity.role;
  token.b2b = identity.b2b;
  token.roleCheckedAt = Date.now();
  delete token.authIdentityError;
}

export function applySignedInUser(token: JWT, user: SignedInUser) {
  token.id = user.id;
  token.name = user.name;
  token.email = user.email;
  token.picture = user.image;
  token.accessToken = user.accessToken;
  token.accessTokenExpires = user.accessTokenExpires;
  token.refreshToken = user.refreshToken;
  delete token.authError;
  delete token.authIdentityError;
  token.profileComplete = user.profileComplete;
  token.role = user.role;
  token.b2b = user.b2b;
  token.roleCheckedAt = Date.now();
}

export function hasClearedAuthState(token: JWT): boolean {
  return typeof token.authError === "string" && !token.accessToken;
}

/**
 * `update({ refreshB2b: true })` no cliente força refresh imediato do contexto B2B (aceite de
 * convite, troca de empresa, mudança de papel, aprovação/suspensão) — a sessão não pode ficar
 * stale. Só dispara com o flag explícito, para não re-buscar `/auth/me` a cada `update()`.
 */
export async function syncRequestedB2bContext(
  token: JWT,
  trigger: string | undefined,
  session: unknown,
) {
  const refreshRequested =
    trigger === "update" && (session as { refreshB2b?: boolean } | undefined)?.refreshB2b === true;

  if (!refreshRequested || typeof token.accessToken !== "string") {
    return;
  }

  const identity = await wpFetchAuthenticatedIdentity(token.accessToken);

  if (!identity.ok) {
    return;
  }

  applyIdentityToToken(token, identity);

  if (typeof identity.profileComplete === "boolean") {
    token.profileComplete = identity.profileComplete;
  }
}

export async function revalidateStaleIdentity(token: JWT) {
  if (typeof token.accessToken !== "string" || !shouldRevalidateRole(token)) {
    return;
  }

  applyIdentityToToken(token, await wpFetchAuthenticatedIdentity(token.accessToken));
}

export async function ensureFreshAccessToken(token: JWT): Promise<JWT> {
  const accessTokenExpires =
    typeof token.accessTokenExpires === "number"
      ? token.accessTokenExpires
      : getAccessTokenExpiresAt(token.accessToken);

  if (!accessTokenExpires || Date.now() < accessTokenExpires - ACCESS_TOKEN_REFRESH_SKEW_MS) {
    token.accessTokenExpires = accessTokenExpires;
    return token;
  }

  if (typeof token.refreshToken !== "string") {
    clearInvalidAuthState(token, "missing_refresh_token");
    return token;
  }

  const refreshedToken = await wpRefreshAuthToken(token.refreshToken);

  if (!refreshedToken.ok) {
    clearInvalidAuthState(token, refreshedToken.error);
    return token;
  }

  token.accessToken = refreshedToken.accessToken;
  token.accessTokenExpires = getAccessTokenExpiresAt(refreshedToken.accessToken);
  applyIdentityToToken(token, await wpFetchAuthenticatedIdentity(refreshedToken.accessToken));
  delete token.authError;

  return token;
}

export function resolveSessionRole(token: JWT): string | undefined {
  if (token.authIdentityError === true) {
    return undefined;
  }

  return typeof token.role === "string" ? token.role : undefined;
}
