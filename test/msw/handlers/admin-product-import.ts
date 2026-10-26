import { http, HttpResponse } from "msw";

/** URL fictícia do upload direto devolvida no tíquete da importação de produtos. */
export const PRODUCT_IMPORT_UPLOAD_URL = "http://wordpress-admin.test/wp-json/papelito/v1/uploads/direct";

const HEADERS = ["nome", "categoria", "subcategorias", "preco_regular", "peso_kg"];

function row(line: number, status: string, name: string, extra: Record<string, unknown> = {}) {
  return {
    line,
    cells: [name, "sedas", "", "84,90", "0,32"],
    name,
    category: { slug: "sedas", name: "Sedas" },
    subcategories: [],
    price: 84.9,
    salePrice: null,
    incomplete: false,
    status,
    issues: [],
    repeatOf: null,
    duplicateOf: null,
    ...extra,
  };
}

/**
 * Prévia como o WordPress devolve, com um caso de cada situação — o mesmo arquivo usado no
 * teste de ponta a ponta contra a cópia do banco local.
 */
export function productImportPreviewResponse() {
  return {
    token: "token-da-previa",
    fileName: "produtos-teste.csv",
    headers: HEADERS,
    columns: HEADERS.map((header) => ({ header, field: header })),
    alreadyImported: null,
    summary: { novo: 1, incompleto: 1, duplicado: 1, repetida: 1, erro: 1, total: 5 },
    rows: [
      row(2, "novo", "Seda Teste Brown Slim"),
      row(3, "incompleto", "Filtro Teste Mentol", {
        incomplete: true,
        issues: [{ field: "peso_kg", level: "warn", message: "Sem peso: entra incompleto e não cota frete até ser preenchido." }],
      }),
      row(4, "duplicado", "Dichavador Neon", { duplicateOf: { id: 11849, sku: "PPL-011849", name: "Dichavador Neon" } }),
      row(5, "repetida", "Seda Teste Brown Slim", { repeatOf: 2 }),
      row(6, "erro", "Filtro Teste Gomado", {
        category: null,
        issues: [{ field: "categoria", level: "error", message: "Categoria “filtro” não existe — você quis dizer “filtros”?" }],
      }),
    ],
  };
}

/** Resultado da confirmação para as linhas que entraram. */
export function productImportResultResponse(createLines: number[]) {
  const created = [
    { line: 2, productId: 15192, sku: "PPL-015192", name: "Seda Teste Brown Slim", incomplete: false },
    { line: 3, productId: 15193, sku: "PPL-015193", name: "Filtro Teste Mentol", incomplete: true },
    ...(createLines.includes(4) ? [{ line: 4, productId: 15194, sku: "PPL-015194", name: "Dichavador Neon", incomplete: false }] : []),
  ];
  return {
    lot: "L-0001",
    operationId: 1,
    created,
    ignored: [
      ...(createLines.includes(4) ? [] : [{ line: 4, name: "Dichavador Neon", status: "duplicado", issues: [] }]),
      { line: 5, name: "Seda Teste Brown Slim", status: "repetida", issues: [] },
    ],
    errors: [
      { line: 6, name: "Filtro Teste Gomado", status: "erro", issues: [{ field: "categoria", level: "error", message: "Categoria “filtro” não existe." }] },
    ],
  };
}

/** Handlers da página de Relatórios: tíquete e prévia da importação, confirmação e contagens. */
export const adminProductImportHandlers = [
  http.post("*/api/uploads/ticket", async ({ request }) => {
    const body = (await request.clone().json()) as { purpose?: string };
    if (body.purpose !== "admin-product-import") return undefined;
    return HttpResponse.json({ ticket: "ticket-product-import", uploadUrl: PRODUCT_IMPORT_UPLOAD_URL, expiresAt: "2026-10-25T12:00:00Z" }, { status: 201 });
  }),
  http.post(PRODUCT_IMPORT_UPLOAD_URL, () => HttpResponse.json(productImportPreviewResponse(), { status: 201 })),
  http.post("*/api/admin/products/import", async ({ request }) => {
    const body = (await request.json()) as { createLines: number[] };
    return HttpResponse.json(productImportResultResponse(body.createLines), { status: 201 });
  }),
  http.get("*/api/admin/reports/sales/count", () => HttpResponse.json({ count: 3 })),
  http.get("*/api/admin/reports/users/count", () => HttpResponse.json({ count: 5 })),
  http.get("*/api/admin/reports/products/count", () => HttpResponse.json({ count: 49 })),
];
