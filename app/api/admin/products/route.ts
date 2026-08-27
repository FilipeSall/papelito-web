import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminApiSession, readWithAdminApiSession } from "@/lib/server/admin-api-auth";

import {
  createAdminProduct,
  getAdminProductsSnapshot,
  type AdminProductPayload,
} from "@/lib/server/admin-products";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters = {
    category: url.searchParams.get("category") ?? undefined,
    exclude: (url.searchParams.get("exclude") ?? "")
      .split(",")
      .map((id) => Number.parseInt(id, 10))
      .filter((id) => Number.isInteger(id) && id > 0),
    page: url.searchParams.get("page") ?? undefined,
    perPage: url.searchParams.get("perPage") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    stockStatus: url.searchParams.get("stockStatus") ?? undefined,
  };

  console.info("[api/admin/products][GET] incoming", filters);

  const result = await readWithAdminApiSession((accessToken) =>
    getAdminProductsSnapshot(accessToken, filters),
  );

  if ("error" in result) {
    return NextResponse.json({ message: result.error }, { status: result.status });
  }

  const snapshot = result.data;

  console.info("[api/admin/products][GET] result", {
    currentPage: snapshot.currentPage,
    filters,
    issueCount: snapshot.issues.length,
    issues: snapshot.issues,
    productIds: snapshot.products.slice(0, 10).map((product) => product.id),
    productsCount: snapshot.products.length,
    totalPages: snapshot.totalPages,
    totalProducts: snapshot.totalProducts,
  });

  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const auth = await getAdminApiSession();

  if ("error" in auth) {
    return NextResponse.json({ message: auth.error }, { status: auth.status });
  }

  const payload = (await request.json().catch(() => null)) as AdminProductPayload | null;

  if (!payload || !payload.name?.trim()) {
    return NextResponse.json(
      { message: "Nome do produto e obrigatório." },
      { status: 422 },
    );
  }

  try {
    const product = await createAdminProduct(auth.accessToken, {
      ...payload,
      status: payload.status || "draft",
    });
    revalidateTag("admin-products", "max");
    revalidateTag("wp:products", "max");
    revalidateTag("wp:categories", "max");
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível criar o produto.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
