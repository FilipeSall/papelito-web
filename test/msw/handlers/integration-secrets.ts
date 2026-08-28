import { http, HttpResponse } from "msw";

const items = [
  {
    class: "analytics",
    configured: true,
    label: "ID de medição do GA4",
    last4: "1234",
    slug: "ga4_measurement_id",
    source: "vault",
    updated_at: null,
    updated_by: null,
  },
  {
    class: "analytics",
    configured: false,
    label: "Segredo da API do GA4",
    last4: null,
    slug: "ga4_api_secret",
    source: null,
    updated_at: null,
    updated_by: null,
  },
];

export const integrationSecretsHandlers = [
  http.get("*/api/admin/integration-secrets", () => HttpResponse.json({ items })),
  http.put("*/api/admin/integration-secrets/:slug", () => HttpResponse.json(items[0])),
  http.delete("*/api/admin/integration-secrets/:slug", () => HttpResponse.json(items[0])),
  http.post("*/api/admin/integration-secrets", () => HttpResponse.json(items[0])),
];
