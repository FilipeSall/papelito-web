import { http, HttpResponse } from "msw";

function makeJwt(exp: number) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
    "base64url",
  );
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");

  return `${header}.${payload}.signature`;
}

export const authHandlers = [
  http.post("http://localhost:8080/graphql", async ({ request }) => {
    const body = (await request.json()) as {
      query?: string;
      variables?: Record<string, string>;
    };

    if (body.query?.includes("mutation Login")) {
      if (body.variables?.u === "nao-verificado@papelito.com") {
        return HttpResponse.json({
          errors: [{ message: "Confirme seu e-mail antes de entrar." }],
        });
      }

      if (body.variables?.u === "invalido@papelito.com") {
        return HttpResponse.json({ data: { login: null } });
      }

      return HttpResponse.json({
        data: {
          login: {
            authToken: makeJwt(Math.floor(Date.now() / 1000) + 3600),
            refreshToken: "refresh-token",
            user: {
              databaseId: 42,
              email: body.variables?.u ?? "cliente@papelito.com",
              firstName: "Cliente",
              lastName: "Papelito",
            },
          },
        },
      });
    }

    if (body.query?.includes("mutation Refresh")) {
      if (body.variables?.r === "refresh-invalido") {
        return HttpResponse.json({
          errors: [{ message: "The provided refresh token is invalid" }],
          data: {
            refreshJwtAuthToken: null,
          },
        });
      }

      return HttpResponse.json({
        data: {
          refreshJwtAuthToken: {
            authToken: makeJwt(Math.floor(Date.now() / 1000) + 7200),
          },
        },
      });
    }

    return HttpResponse.json({ data: {} });
  }),
  http.post("http://localhost:8080/wp-json/papelito/v1/auth/google", async () =>
    HttpResponse.json({
      authToken: makeJwt(Math.floor(Date.now() / 1000) + 3600),
      refreshToken: "refresh-token",
      user: {
        databaseId: 42,
        email: "google@papelito.com",
        firstName: "Google",
        lastName: "User",
      },
      profileComplete: false,
    }),
  ),
  http.get("http://localhost:8080/wp-json/papelito/v1/auth/me", async ({ request }) => {
    const authHeader = request.headers.get("authorization");

    if (authHeader?.includes("seller-token")) {
      return HttpResponse.json({ user: { role: "seller" } });
    }

    if (authHeader?.includes("admin-token")) {
      return HttpResponse.json({ user: { role: "administrator" } });
    }

    return HttpResponse.json({ user: { role: "customer" } });
  }),
];
