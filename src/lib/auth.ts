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

const WP_CUSTOMER_ROLE_QUERY = `
  query CurrentCustomerRole {
    customer {
      role
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

type WpCustomerRoleResponse = {
  customer?: {
    role?: string | null;
  } | null;
};

type WpAuthIdentityResponse = {
  user?: {
    role?: string | null;
    profileComplete?: boolean | null;
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

function normalizeRole(role: unknown): string | undefined {
  return typeof role === "string" ? role.trim().toLowerCase() : undefined;
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
    role?: string;
  },
  authError: RefreshAuthTokenError,
) {
  delete token.accessToken;
  delete token.accessTokenExpires;
  delete token.refreshToken;
  delete token.role;
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

async function wpFetchGraphqlCustomerRole(accessToken: string): Promise<string | undefined> {
  try {
    const response = await fetch(getWpGraphqlEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        query: WP_CUSTOMER_ROLE_QUERY,
      }),
      cache: "no-store",
    });

    const json = (await response.json()) as {
      data?: WpCustomerRoleResponse;
      errors?: Array<{ message?: string }>;
    };

    if (!response.ok || json.errors?.length) {
      return undefined;
    }

    return normalizeRole(json.data?.customer?.role);
  } catch {
    return undefined;
  }
}

async function wpFetchAuthenticatedIdentity(accessToken: string): Promise<{
  profileComplete?: boolean;
  role?: string;
}> {
  try {
    const identity = await wpRest<WpAuthIdentityResponse>("/papelito/v1/auth/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (identity.ok) {
      return {
        role: normalizeRole(identity.data.user?.role),
        profileComplete:
          typeof identity.data.user?.profileComplete === "boolean"
            ? identity.data.user.profileComplete
            : undefined,
      };
    }
  } catch {
    // Falls back to the existing GraphQL lookup while the custom identity route is unavailable.
  }

  return {
    role: await wpFetchGraphqlCustomerRole(accessToken),
  };
}

async function wpFetchAuthenticatedRole(accessToken: string): Promise<string | undefined> {
  return (await wpFetchAuthenticatedIdentity(accessToken)).role;
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
      };

      userWithTokens.id = String(wpAuth.user.databaseId);
      userWithTokens.accessToken = wpAuth.authToken;
      userWithTokens.accessTokenExpires = getAccessTokenExpiresAt(wpAuth.authToken);
      userWithTokens.refreshToken = wpAuth.refreshToken;
      userWithTokens.profileComplete = wpAuth.profileComplete;
      userWithTokens.role = await wpFetchAuthenticatedRole(wpAuth.authToken);

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.accessTokenExpires = (user as { accessTokenExpires?: number }).accessTokenExpires;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;
        delete token.authError;
        token.profileComplete = (user as { profileComplete?: boolean }).profileComplete;
        token.role = (user as { role?: string }).role;
      }

      if (typeof token.authError === "string" && !token.accessToken) {
        return token;
      }

      if (!token.role && typeof token.accessToken === "string") {
        token.role = await wpFetchAuthenticatedRole(token.accessToken);
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
      token.role = (await wpFetchAuthenticatedRole(refreshedToken.accessToken)) ?? token.role;
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
      session.profileComplete =
        typeof token.profileComplete === "boolean" ? token.profileComplete : undefined;
      session.role = typeof token.role === "string" ? token.role : undefined;

      return session;
    },
  },
};
