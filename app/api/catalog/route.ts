import { NextResponse } from "next/server";

import { resolveCatalogPdf } from "@/lib/server/catalog-pdf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const catalog = await resolveCatalogPdf(request.url);

  if (!catalog.ok) {
    console.error("[api/catalog] catalog_not_found");
    return NextResponse.json(
      { code: catalog.code, message: catalog.message },
      { status: 503 },
    );
  }

  const body = new ArrayBuffer(catalog.bytes.byteLength);
  new Uint8Array(body).set(catalog.bytes);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Disposition": `inline; filename="${catalog.filename}"`,
      "Content-Type": "application/pdf",
      "X-Papelito-Catalog-Source": catalog.source,
    },
  });
}
