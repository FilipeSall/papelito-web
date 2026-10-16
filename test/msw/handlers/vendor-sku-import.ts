import { http, HttpResponse } from "msw";

/** URL fictícia do upload direto ao WordPress devolvida no tíquete. */
export const SKU_IMPORT_UPLOAD_URL = "http://wordpress.test/wp-json/papelito/v1/uploads/direct";

function target(productId: number, name: string, papelitoSku: string | null, currentCode: string | null, newCode: string) {
  return { product_id: productId, name, papelito_sku: papelitoSku, current_code: currentCode, new_code: newCode };
}

/**
 * Prévia do WordPress com um caso de cada: exato, sinônimo (dichavador com três cores),
 * revisão, não encontrado e já atualizado. Produtos e códigos são do catálogo real.
 */
export function skuImportPreviewResponse() {
  return {
    summary: {
      total: 5, changes: 4, exact: 1, synonym: 1, review: 1, not_found: 1,
      conflict: 0, invalid: 0, duplicate: 0, up_to_date: 1,
    },
    rows: [
      {
        line: 2, description: "SEDA PAPELITO BROWN KING SIZE", subgroup: "HEADSHOP - SEDA PAPELITO", code: "585",
        status: "exact", match: "exact", reason: "", changes: 1, candidates: [],
        family: { family_id: 11768, name: "Seda Brown King Size", targets: [target(11768, "Seda Brown King Size", "PP01030001", "SEDA-01", "585")] },
      },
      {
        line: 3, description: "TRITURADOR PLASTICO PAPELITO CORES", subgroup: "HEADSHOP - TRITURADORES", code: "6136",
        status: "synonym", match: "synonym", reason: "", changes: 3, candidates: [],
        family: {
          family_id: 11845, name: "Dichavador Cores", targets: [
            target(11846, "Dichavador Cores - Azul", null, "DICH-001", "6136"),
            target(11847, "Dichavador Cores - Rosa", null, "DICH-001", "6136"),
            target(11848, "Dichavador Cores - Verde", null, "DICH-001", "6136"),
          ],
        },
      },
      {
        line: 4, description: "SEDA PAPELITO BROWN KING SIZE + PITEIRA", subgroup: "HEADSHOP - SEDA PAPELITO", code: "9377",
        status: "review", match: "review", reason: "A descrição não bate integralmente com nenhum produto; confira a sugestão.",
        changes: 0, family: null,
        candidates: [{ family_id: 11772, name: "Seda brown Com Piteira", targets: [target(11772, "Seda brown Com Piteira", "PP01030003", null, "9377")] }],
      },
      {
        line: 5, description: "SEDA PAPELITO TRADICIONAL KING SIZE C/50", subgroup: "HEADSHOP - SEDA PAPELITO", code: "586",
        status: "not_found", match: "not_found", reason: "Nenhum produto publicado é compatível com esta descrição.",
        changes: 0, family: null, candidates: [],
      },
      {
        line: 6, description: "SEDA PAPELITO SLIM KING SIZE", subgroup: "HEADSHOP - SEDA PAPELITO", code: "587",
        status: "up_to_date", match: "exact", reason: "O código deste produto já é este.", changes: 0, candidates: [],
        family: { family_id: 11776, name: "Seda Slim King Size", targets: [target(11776, "Seda Slim King Size", "PP01020002", "587", "587")] },
      },
    ],
  };
}

type ConfirmRow = {
  line: number;
  description: string;
  code: string;
  expected: { product_id: number; current_code: string | null }[];
};

/** Resultado como o WordPress devolve: código `STALE` simula valor alterado desde a prévia. */
export function skuImportConfirmResponse(rows: ConfirmRow[]) {
  const results = rows.map((row) => {
    const stale = row.code === "STALE";
    return {
      line: row.line,
      description: row.description,
      code: row.code,
      status: stale ? "stale" : "applied",
      reason: stale ? "O código deste produto mudou desde a prévia. Refaça a importação." : "",
      targets: stale ? [] : row.expected.map((item) => ({
        product_id: item.product_id, name: `Item ${item.product_id}`, old_code: item.current_code, new_code: row.code,
      })),
    };
  });
  const updated = results.reduce((total, row) => total + row.targets.length, 0);
  return {
    batch_id: "6f1c2a8e-0000-4000-8000-000000000001",
    summary: { updated_items: updated, applied: results.filter((row) => row.status === "applied").length },
    rows: results,
  };
}

/** Handlers da importação de SKUs: tíquete do vendor, upload direto com a prévia e confirmação. */
export const vendorSkuImportHandlers = [
  http.post("*/api/uploads/ticket", async ({ request }) => {
    const body = await request.clone().json() as { purpose?: string };
    if (body.purpose !== "vendor-sku-import") return undefined;
    return HttpResponse.json({ ticket: "ticket-sku-import", uploadUrl: SKU_IMPORT_UPLOAD_URL, expiresAt: "2026-10-15T12:00:00Z" }, { status: 201 });
  }),
  http.post(SKU_IMPORT_UPLOAD_URL, () => HttpResponse.json(skuImportPreviewResponse(), { status: 201 })),
  http.post("*/api/vendor/stock/vendor-codes/import", async ({ request }) => {
    const body = await request.json() as { rows: ConfirmRow[] };
    return HttpResponse.json(skuImportConfirmResponse(body.rows));
  }),
];
