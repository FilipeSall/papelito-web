import { http, HttpResponse } from "msw";

const profile = {
  active: true,
  code: "P04",
  created_at: "2026-09-17 12:00:00",
  height_mm: 40,
  id: 901,
  label: "Caixa RPC P04",
  length_mm: 160,
  max_payload_g: 1500,
  source: "rpc",
  tare_weight_g: 100,
  updated_at: "2026-09-17 12:00:00",
  version: 1,
  width_mm: 120,
};

const catalog = [
  {
    category: "Pequena",
    code: "P04",
    height_mm: 40,
    label: "Caixa RPC P04",
    length_mm: 160,
    max_payload_g: 1500,
    width_mm: 120,
  },
];

/**
 * Handlers MSW das rotas de embalagem do vendor.
 */
export const packagingProfilesHandlers = [
  http.get("*/api/vendor/packaging-profiles", () => HttpResponse.json({ items: [profile] })),
  http.get("*/api/vendor/packaging-profiles/catalog", () => HttpResponse.json({ items: catalog })),
  http.post("*/api/vendor/packaging-profiles", () => HttpResponse.json({ items: [profile] }, { status: 201 })),
  http.put("*/api/vendor/packaging-profiles/:id", () => HttpResponse.json({ items: [profile] })),
  http.post("*/api/vendor/packaging-profiles/:id/deactivate", () =>
    HttpResponse.json({ items: [{ ...profile, active: false }] }),
  ),
];
