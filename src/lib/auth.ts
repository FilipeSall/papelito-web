import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import type { WpB2bContext } from "@/lib/server/auth-jwt";
import {
  applySignedInUser,
  ensureFreshAccessToken,
  getAccessTokenExpiresAt,
  hasClearedAuthState,
  resolveSessionRole,
  revalidateStaleIdentity,
  syncRequestedB2bContext,
  wpFetchAuthenticatedIdentity,
} from "@/lib/server/auth-jwt";
import { getWpGraphqlEndpoint } from "@/lib/server/env";
import { createGoogleRegistrationTicket } from "@/lib/server/google-registration-ticket";
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
  unavailable?: boolean;
};

async function wpLogin(username: string, password: string): Promise<WpLoginResult> {
  try {
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
      signal: AbortSignal.timeout(10_000),
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

    if (!response.ok) {
      return { login: null, unavailable: true };
    }

    return {
      login: json.data?.login ?? null,
      errorMessage: json.errors?.[0]?.message,
    };
  } catch {
    return { login: null, unavailable: true };
  }
}

function isEmailVerificationError(message: string | undefined) {
  return message === "Confirme seu e-mail antes de entrar.";
}

/**
 * Espelha `PAPELITO_LOGIN_RATE_LIMIT_MESSAGE` do `papelito-hardening.php`.
 *
 * O WordPress devolve isso como erro GraphQL em HTTP 200, e não como 429, justamente para o motivo
 * sobreviver até aqui: antes o rate limit matava a requisição com HTML e virava "indisponível",
 * indistinguível de uma queda do backend.
 */
function isLoginRateLimitError(message: string | undefined) {
  return message === "papelito_login_rate_limited";
}

type WpGoogleExchangeResult =
  | { ok: true; data: WpAuthResponse }
  | { ok: false; code: string };

async function wpExchangeGoogleToken(idToken: string): Promise<WpGoogleExchangeResult> {
  const result = await wpRest<WpAuthResponse>("/papelito/v1/auth/google", {
    json: { id_token: idToken },
    timeoutMs: 10_000,
  });

  if (!result.ok) {
    console.error("[auth] Google → WP exchange failed", result.status, result.error);
    return { ok: false, code: result.error.code };
  }

  return { ok: true, data: result.data };
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

      const username = credentials.username.trim().toLowerCase();
      const { login, errorMessage, unavailable } = await wpLogin(username, credentials.password);

      if (unavailable) {
        throw new Error("papelito_auth_unavailable");
      }

      if (isEmailVerificationError(errorMessage)) {
        throw new Error("papelito_email_not_verified");
      }

      if (isLoginRateLimitError(errorMessage)) {
        throw new Error("papelito_auth_rate_limited");
      }

      if (errorMessage) {
        throw new Error("papelito_invalid_credentials");
      }

      if (!login?.authToken || !login.user?.databaseId) {
        throw new Error("papelito_invalid_credentials");
      }

      const identity = await wpFetchAuthenticatedIdentity(login.authToken);

      if (!identity.ok) {
        throw new Error("papelito_auth_context_unavailable");
      }

      return {
        id: String(login.user.databaseId),
        email: login.user.email ?? username,
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

      if (!wpAuth.ok) {
        if (wpAuth.code === "papelito_pre_account_required") {
          const email = typeof user.email === "string" ? user.email : "";
          const ticket = email ? createGoogleRegistrationTicket(email) : "";
          return ticket
            ? `/cadastro?feedback=google_account_required&googleRegistration=${encodeURIComponent(ticket)}`
            : "/cadastro?feedback=google_account_required";
        }
        return false;
      }

      const wpIdentity = wpAuth.data;

      const userWithTokens = user as typeof user & {
        accessToken?: string;
        accessTokenExpires?: number;
        refreshToken?: string;
        profileComplete?: boolean;
        id?: string;
        role?: string;
        b2b?: WpB2bContext;
      };

      userWithTokens.id = String(wpIdentity.user.databaseId);
      userWithTokens.accessToken = wpIdentity.authToken;
      userWithTokens.accessTokenExpires = getAccessTokenExpiresAt(wpIdentity.authToken);
      userWithTokens.refreshToken = wpIdentity.refreshToken;
      userWithTokens.profileComplete = wpIdentity.profileComplete;

      const identity = await wpFetchAuthenticatedIdentity(wpIdentity.authToken);
      if (!identity.ok) {
        return "/entrar?error=papelito_auth_context_unavailable";
      }
      userWithTokens.role = identity.role;
      userWithTokens.b2b = identity.b2b;

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        applySignedInUser(token, user);
      }

      if (hasClearedAuthState(token)) {
        return token;
      }

      await syncRequestedB2bContext(token, trigger, session);
      await revalidateStaleIdentity(token);

      return ensureFreshAccessToken(token);
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : token.sub;
      }

      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.accessTokenExpires =
        typeof token.accessTokenExpires === "number" ? token.accessTokenExpires : undefined;
      session.authError = typeof token.authError === "string" ? token.authError : undefined;
      session.authIdentityError = token.authIdentityError === true ? true : undefined;
      session.profileComplete =
        typeof token.profileComplete === "boolean" ? token.profileComplete : undefined;
      session.role = resolveSessionRole(token);
      session.b2b = token.authIdentityError === true ? undefined : (token.b2b as typeof session.b2b | undefined);

      return session;
    },
  },
};
