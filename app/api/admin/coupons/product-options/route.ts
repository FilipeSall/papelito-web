import { NextResponse } from "next/server";

import { readWithAdminApiSession } from "@/lib/server/admin-api-auth";
import { wpRest } from "@/lib/server/wp-rest";

type WcProductOption = {
  id?: number;
  name?: string | null;
  sku?: string | null;
};

export type ProductOption = {
  id: number;
  name: string;
  sku: string;
};

const PER_PAGE = 100;

function parseIds(raw: string | null): number[] {
  if (!raw) {
    return [];
  }

  return Array.from(
    new Set(
      raw
        .split(",")
        .map((entry) => Number.parseInt(entry.trim(), 10))
        .filter((entry) => Number.isInteger(entry) && entry > 0),
    ),
  );
}

function mapOption(product: WcProductOption): ProductOption | null {
  const id = typeof product.id === "number" ? product.id : 0;
  const name = typeof product.name === "string" ? product.name.trim() : "";

  if (id <= 0 || name.length === 0) {
    return null;
  }

  return { id, name, sku: typeof product.sku === "string" ? product.sku : "" };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = parseIds(url.searchParams.get("ids"));
  const search = (url.searchParams.get("search") ?? "").trim();

  const params = new URLSearchParams({
    _fields: "id,name,sku",
    order: "asc",
    orderby: "title",
    per_page: String(ids.length > 0 ? Math.min(ids.length, PER_PAGE) : PER_PAGE),
  });

  if (ids.length > 0) {
    // Resolver rótulo de produto já vinculado ao cupom não pode depender do status:
    // um produto despublicado depois continua no cupom e precisa aparecer pelo nome.
    params.set("include", ids.join(","));
    params.set("status", "any");
  } else {
    params.set("status", "publish");

    if (search) {
      params.set("search", search);
    }
  }

  const session = await readWithAdminApiSession((accessToken) =>
    wpRest<WcProductOption[]>(`/wc/v3/products?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );

  if ("error" in session) {
    return NextResponse.json({ message: session.error }, { status: session.status });
  }

  const result = session.data;

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message },
      { status: result.status || 500 },
    );
  }

  const items = Array.isArray(result.data)
    ? result.data.map(mapOption).filter((option): option is ProductOption => option !== null)
    : [];

  return NextResponse.json({ items });
}
