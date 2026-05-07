import { readFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const LOCAL_CATALOG_PATH = path.join(
  process.env.HOME ?? "/home/sea",
  "Downloads",
  "Catálogo de produtos - Papelito.pdf",
);

export async function GET() {
  try {
    const pdfBuffer = await readFile(LOCAL_CATALOG_PATH);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="catalogo-papelito.pdf"',
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { code: "catalog_not_found", message: "Catálogo não disponível." },
      { status: 404 },
    );
  }
}
