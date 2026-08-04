import { HttpResponse, http } from "msw";

const WP_REST_BASE = "http://localhost:8080/wp-json";

export const companyHandlers = [
  http.post(`${WP_REST_BASE}/papelito/v1/companies/billing-email/confirm`, async ({ request }) => {
    const body = (await request.json().catch(() => null)) as { token?: string } | null;
    const token = body?.token ?? "";

    if (token === "valido") {
      return HttpResponse.json({ ok: true });
    }

    if (token === "expirado") {
      return HttpResponse.json(
        {
          code: "papelito_b2b_billing_token_expired",
          message: "Link de confirmação expirado. Solicite um novo e-mail para continuar.",
          data: { status: 410 },
        },
        { status: 410 },
      );
    }

    return HttpResponse.json(
      {
        code: "papelito_b2b_invalid_billing_token",
        message: "Link de confirmação inválido ou já utilizado.",
        data: { status: 404 },
      },
      { status: 404 },
    );
  }),
];
