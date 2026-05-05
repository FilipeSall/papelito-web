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

async function wpLogin(username: string, password: string) {
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
  };

  return json.data?.login ?? null;
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

async function wpRefreshAuthToken(refreshToken: string): Promise<string | null> {
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

  const json = (await response.json()) as {
    data?: {
      refreshJwtAuthToken?: WpRefreshResponse | null;
    };
    errors?: Array<{ message?: string }>;
  };

  if (!response.ok || json.errors?.length) {
    console.error("[auth] JWT refresh failed", json.errors);
    return null;
  }

  return json.data?.refreshJwtAuthToken?.authToken ?? null;
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

      const data = await wpLogin(credentials.username, credentials.password);

      if (!data?.authToken || !data.user?.databaseId) {
        return null;
      }

      return {
        id: String(data.user.databaseId),
        email: data.user.email ?? credentials.username,
        name: `${data.user.firstName ?? ""} ${data.user.lastName ?? ""}`.trim(),
        accessToken: data.authToken,
        accessTokenExpires: getAccessTokenExpiresAt(data.authToken),
        refreshToken: data.refreshToken,
        profileComplete: true,
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
      };

      userWithTokens.id = String(wpAuth.user.databaseId);
      userWithTokens.accessToken = wpAuth.authToken;
      userWithTokens.accessTokenExpires = getAccessTokenExpiresAt(wpAuth.authToken);
      userWithTokens.refreshToken = wpAuth.refreshToken;
      userWithTokens.profileComplete = wpAuth.profileComplete;

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.accessTokenExpires = (user as { accessTokenExpires?: number }).accessTokenExpires;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;
        token.profileComplete = (user as { profileComplete?: boolean }).profileComplete;
      }

      const accessTokenExpires =
        typeof token.accessTokenExpires === "number"
          ? token.accessTokenExpires
          : getAccessTokenExpiresAt(token.accessToken);

      if (!accessTokenExpires || Date.now() < accessTokenExpires - 30_000) {
        token.accessTokenExpires = accessTokenExpires;
        return token;
      }

      if (!token.refreshToken) {
        delete token.accessToken;
        delete token.accessTokenExpires;
        return token;
      }

      const refreshedAccessToken = await wpRefreshAuthToken(token.refreshToken);

      if (!refreshedAccessToken) {
        delete token.accessToken;
        delete token.accessTokenExpires;
        return token;
      }

      token.accessToken = refreshedAccessToken;
      token.accessTokenExpires = getAccessTokenExpiresAt(refreshedAccessToken);

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : token.sub;
      }

      session.accessToken =
        typeof token.accessToken === "string" ? token.accessToken : undefined;
      session.refreshToken =
        typeof token.refreshToken === "string" ? token.refreshToken : undefined;
      session.profileComplete =
        typeof token.profileComplete === "boolean" ? token.profileComplete : undefined;

      return session;
    },
  },
};
