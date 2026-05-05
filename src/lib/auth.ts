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
        refreshToken?: string;
        profileComplete?: boolean;
        id?: string;
      };

      userWithTokens.id = String(wpAuth.user.databaseId);
      userWithTokens.accessToken = wpAuth.authToken;
      userWithTokens.refreshToken = wpAuth.refreshToken;
      userWithTokens.profileComplete = wpAuth.profileComplete;

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;
        token.profileComplete = (user as { profileComplete?: boolean }).profileComplete;
      }

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
