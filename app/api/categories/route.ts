import { NextResponse } from "next/server";

import { getPapelitoTaxonomy } from "@/features/catalog/services/get-papelito-categories";

/**
 * Árvore pública de categorias, para a navegação e os filtros do catálogo.
 *
 * Substitui os hardcodes do frontend — `CATEGORIES_NAV_ITEMS` carregava um
 * `// TODO: Substituir por requisição ao backend — GET /api/categories` desde a
 * primeira versão.
 */
export async function GET() {
  const taxonomy = await getPapelitoTaxonomy();

  if (!taxonomy.available) {
    return NextResponse.json(
      { message: "Catálogo de categorias indisponível." },
      { status: 503 },
    );
  }

  return NextResponse.json({
    categories: taxonomy.categories,
    version: taxonomy.version,
  });
}
