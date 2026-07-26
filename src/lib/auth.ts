import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { getWpGraphqlEndpoint } from "@/lib/server/env";
import { wpRest } from "@/lib/server/wp-rest";

const WP_LOGIN_MUTATION = `
  mutation Login($u: String!, $p: String!) {
    login(input: { username: $u, password: $p }) {
      authToken
      refreshToken
      user {
        id
        databaseId
        email
        firstName
        lastName
      }
    }
  }
`;

const WP_REFRESH_TOKEN_MUTATION = `
  mutation Refresh($r: String!) {
    refreshJwtAuthToken(input: { jwtRefreshToken: $r }) {
      authToken
    }
  }
`;

type WpAuthResponse = {
  authToken: string;
  refreshToken: string;
  user: {
    databaseId: number;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  profileComplete: boolean;
};

type WpRefreshResponse = {
  authToken: string;
};

type WpRefreshGraphqlResponse = {
  data?: {
    refreshJwtAuthToken?: WpRefreshResponse | null;
  };
  errors?: Array<{ message?: string }>;
};

type RefreshAuthTokenError =
  | "invalid_refresh_token"
  | "missing_refresh_token"
  | "token_refresh_failed";

type RefreshAuthTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; error: RefreshAuthTokenError };

type WpAuthIdentityResponse = {
  user?: {
    role?: string | null;
    profileComplete?: boolean | null;
  } | null;
  b2b?: {
		isB2bCohort?: boolean;
    canPurchase?: boolean;
		purchaseBlockReason?: string | null;
		requiresB2bOnboarding?: boolean;
		userContextType?: "internal_admin" | "vendor" | "customer" | "hybrid";
		isInternalAdmin?: boolean;
		isVendor?: boolean;
		hasCustomerContext?: boolean;
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
  } | null;
};

type WpGraphqlError = {
  message?: string;
};

type WpLoginResult = {
  login: {
    authToken?: string;
    refreshToken?: string;
    user?: {
      databaseId?: number;
      email?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    };
  } | null;
  errorMessage?: string;
};

const ROLE_REVALIDATE_INTERVAL_MS = 5 * 60 * 1000;

function normalizeRole(role: unknown): string | undefined {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
}

function shouldRevalidateRole(token: {
  role?: unknown;
  roleCheckedAt?: unknown;
}): boolean {
  if (!token.role) {
    return true;
  }

  const checkedAt =
    typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : undefined;

  if (checkedAt === undefined) {
    return true;
  }

  return Date.now() - checkedAt >= ROLE_REVALIDATE_INTERVAL_MS;
}

async function wpLogin(username: string, password: string): Promise<WpLoginResult> {
  const response = await fetch(getWpGraphqlEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: WP_LOGIN_MUTATION,
      variables: {
        u: username,
        p: password,
      },
    }),
  });

  const json = (await response.json()) as {
    data?: {
      login?: {
        authToken?: string;
        refreshToken?: string;
        user?: {
          databaseId?: number;
          email?: string | null;
          firstName?: string | null;
          lastName?: string | null;
        };
      };
    };
    errors?: WpGraphqlError[];
  };

  return {
    login: json.data?.login ?? null,
    errorMessage: json.errors?.[0]?.message,
  };
}

function isEmailVerificationError(message: string | undefined) {
  return message === "Confirme seu e-mail antes de entrar.";
}

async function wpExchangeGoogleToken(idToken: string): Promise<WpAuthResponse | null> {
  const result = await wpRest<WpAuthResponse>("/papelito/v1/auth/google", {
    json: { id_token: idToken },
  });

  if (!result.ok) {
    console.error("[auth] Google → WP exchange failed", result.status, result.error);
    return null;
  }

  return result.data;
}

function clearInvalidAuthState(
  token: {
    accessToken?: string;
    accessTokenExpires?: number;
    refreshToken?: string;
    authError?: string;
    authIdentityError?: boolean;
    role?: string;
    roleCheckedAt?: number;
  },
  authError: RefreshAuthTokenError,
) {
  delete token.accessToken;
  delete token.accessTokenExpires;
  delete token.refreshToken;
  delete token.role;
  delete token.roleCheckedAt;
  delete token.authIdentityError;
  token.authError = authError;
}

function getRefreshErrorCode(errors: Array<{ message?: string }> | undefined): RefreshAuthTokenError {
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

type WpAuthenticatedIdentity = {
  ok: boolean;
  profileComplete?: boolean;
  role?: string;
  b2b?: NonNullable<WpAuthIdentityResponse["b2b"]>;
};

async function wpFetchAuthenticatedIdentity(accessToken: string): Promise<WpAuthenticatedIdentity> {
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

function getAccessTokenExpiresAt(accessToken?: string) {
  if (!accessToken) {
    return undefined;
  }

  try {
    const [, payload] = accessToken.split(".");

    if (!payload) {
      return undefined;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = JSON.parse(
      Buffer.from(normalizedPayload, "base64").toString("utf-8"),
    ) as { exp?: number };

    return typeof decodedPayload.exp === "number"
      ? decodedPayload.exp * 1000
      : undefined;
  } catch {
    return undefined;
  }
}

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

providers.push(
  CredentialsProvider({
    name: "WordPress",
    credentials: {
      username: { label: "E-mail/Usuário", type: "text" },
      password: { label: "Senha", type: "password" },
    },
    authorize: async (credentials) => {
      if (!credentials?.username || !credentials.password) {
        return null;
      }

      const { login, errorMessage } = await wpLogin(credentials.username, credentials.password);

      if (isEmailVerificationError(errorMessage)) {
        throw new Error("papelito_email_not_verified");
      }

      if (errorMessage) {
        throw new Error("papelito_invalid_credentials");
      }

      if (!login?.authToken || !login.user?.databaseId) {
        throw new Error("papelito_invalid_credentials");
      }

      const identity = await wpFetchAuthenticatedIdentity(login.authToken);

      return {
        id: String(login.user.databaseId),
        email: login.user.email ?? credentials.username,
        name: `${login.user.firstName ?? ""} ${login.user.lastName ?? ""}`.trim(),
        accessToken: login.authToken,
        accessTokenExpires: getAccessTokenExpiresAt(login.authToken),
        refreshToken: login.refreshToken,
        profileComplete: identity.profileComplete,
        role: identity.role,
        b2b: identity.b2b,
      };
    },
  }),
);

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/entrar",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const idToken = account.id_token;

      if (!idToken) {
        return false;
      }

      const wpAuth = await wpExchangeGoogleToken(idToken);

      if (!wpAuth) {
        return false;
      }

      const userWithTokens = user as typeof user & {
        accessToken?: string;
        accessTokenExpires?: number;
        refreshToken?: string;
        profileComplete?: boolean;
        id?: string;
        role?: string;
        b2b?: NonNullable<WpAuthIdentityResponse["b2b"]>;
      };

      userWithTokens.id = String(wpAuth.user.databaseId);
      userWithTokens.accessToken = wpAuth.authToken;
      userWithTokens.accessTokenExpires = getAccessTokenExpiresAt(wpAuth.authToken);
      userWithTokens.refreshToken = wpAuth.refreshToken;
      userWithTokens.profileComplete = wpAuth.profileComplete;

      const identity = await wpFetchAuthenticatedIdentity(wpAuth.authToken);
      userWithTokens.role = identity.role;
      userWithTokens.b2b = identity.b2b;

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.accessTokenExpires = (user as { accessTokenExpires?: number }).accessTokenExpires;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;
        delete token.authError;
        delete token.authIdentityError;
        token.profileComplete = (user as { profileComplete?: boolean }).profileComplete;
        token.role = (user as { role?: string }).role;
        token.b2b = (user as { b2b?: NonNullable<WpAuthIdentityResponse["b2b"]> }).b2b;
        token.roleCheckedAt = Date.now();
      }

      if (typeof token.authError === "string" && !token.accessToken) {
        return token;
      }

      // update({ refreshB2b: true }) no cliente força refresh imediato do contexto B2B (aceite de
      // convite, troca de empresa, mudança de papel, aprovação/suspensão) — a sessão não pode ficar
      // stale. Só dispara com o flag explícito, para não re-buscar /auth/me a cada update().
      if (
        trigger === "update" &&
        (session as { refreshB2b?: boolean } | undefined)?.refreshB2b === true &&
        typeof token.accessToken === "string"
      ) {
        const identity = await wpFetchAuthenticatedIdentity(token.accessToken);
        if (identity.ok) {
          token.role = identity.role;
          token.b2b = identity.b2b;
          if (typeof identity.profileComplete === "boolean") {
            token.profileComplete = identity.profileComplete;
          }
          token.roleCheckedAt = Date.now();
          delete token.authIdentityError;
        }
      }

      if (typeof token.accessToken === "string" && shouldRevalidateRole(token)) {
        const identity = await wpFetchAuthenticatedIdentity(token.accessToken);

        if (identity.ok) {
          token.role = identity.role;
          token.b2b = identity.b2b;
          token.roleCheckedAt = Date.now();
          delete token.authIdentityError;
        } else {
          token.authIdentityError = true;
        }
      }

      const accessTokenExpires =
        typeof token.accessTokenExpires === "number"
          ? token.accessTokenExpires
          : getAccessTokenExpiresAt(token.accessToken);

      if (!accessTokenExpires || Date.now() < accessTokenExpires - 30_000) {
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
      const refreshedIdentity = await wpFetchAuthenticatedIdentity(refreshedToken.accessToken);
      if (refreshedIdentity.ok) {
        token.role = refreshedIdentity.role;
        token.b2b = refreshedIdentity.b2b;
        token.roleCheckedAt = Date.now();
        delete token.authIdentityError;
      } else {
        token.authIdentityError = true;
      }
      delete token.authError;

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : token.sub;
      }

      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.accessTokenExpires =
        typeof token.accessTokenExpires === "number" ? token.accessTokenExpires : undefined;
      session.refreshToken =
        typeof token.refreshToken === "string" ? token.refreshToken : undefined;
      session.authError = typeof token.authError === "string" ? token.authError : undefined;
      session.authIdentityError = token.authIdentityError === true ? true : undefined;
      session.profileComplete =
        typeof token.profileComplete === "boolean" ? token.profileComplete : undefined;
      session.role =
        token.authIdentityError === true
          ? undefined
          : typeof token.role === "string"
            ? token.role
            : undefined;
      session.b2b = token.authIdentityError === true ? undefined : (token.b2b as typeof session.b2b | undefined);

      return session;
    },
  },
};
