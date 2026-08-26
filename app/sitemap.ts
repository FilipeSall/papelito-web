import type { MetadataRoute } from "next";

import { getKitsCatalog } from "@/features/catalog/services/get-kits-catalog";
import { getPapelitoTaxonomy } from "@/features/catalog/services/get-papelito-categories";
import { fetchAllWpProductsResult } from "@/features/catalog/services/wp-catalog";
import { absoluteUrl } from "@/lib/seo/site";

export const revalidate = 3600;

/**
 * Teto da varredura do catálogo para o sitemap.
 *
 * Alinhado ao `CATALOG_SCAN_LIMIT` da vitrine. Se for atingido, o corte é registrado no log em vez
 * de passar silenciosamente — sitemap truncado sem aviso se parece com sitemap completo.
 */
const SITEMAP_PRODUCT_SCAN_LIMIT = 1000;

interface StaticEntry {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}

const STATIC_ENTRIES: StaticEntry[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/produtos", changeFrequency: "daily", priority: 0.9 },
  { path: "/revendedor", changeFrequency: "monthly", priority: 0.9 },
  { path: "/kits", changeFrequency: "weekly", priority: 0.8 },
  { path: "/premium", changeFrequency: "weekly", priority: 0.7 },
  { path: "/novidades", changeFrequency: "daily", priority: 0.7 },
  { path: "/promocoes", changeFrequency: "daily", priority: 0.7 },
  { path: "/colecoes", changeFrequency: "weekly", priority: 0.6 },
  { path: "/pdv", changeFrequency: "monthly", priority: 0.6 },
  { path: "/sobre", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacidade", changeFrequency: "yearly", priority: 0.2 },
];

/**
 * Sitemap único do marketplace.
 *
 * Arquivo único e não índice: o catálogo publicado fica na casa das dezenas de URLs, muito abaixo
 * do limite de 50.000 por sitemap. Quando passar disso, `generateSitemaps()` do Next fatia sem
 * mudar esta fonte de dados.
 *
 * Indisponibilidade do WordPress degrada para as rotas estáticas em vez de lançar: um sitemap
 * parcial ainda é útil, um 500 no `/sitemap.xml` não é.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ENTRIES.map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  const [taxonomy, products, kits] = await Promise.all([
    getPapelitoTaxonomy(),
    fetchAllWpProductsResult({}, SITEMAP_PRODUCT_SCAN_LIMIT, "sitemap"),
    getKitsCatalog(),
  ]);

  for (const category of taxonomy.categories) {
    entries.push({
      url: absoluteUrl(`/categorias/${category.slug}`),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  if (products.truncated) {
    console.warn(
      `[sitemap] Varredura interrompida em ${SITEMAP_PRODUCT_SCAN_LIMIT} produtos; o sitemap está incompleto.`,
    );
  }

  // `fetchAllWpProductsResult` já aplica `isCatalogProductVisible`, o mesmo filtro da vitrine:
  // produto sem categoria, preço ou medidas de frete não chega aqui e portanto não entra no
  // sitemap apontando para um detalhe que responderia 404.
  for (const product of products.products) {
    entries.push({
      url: absoluteUrl(`/produtos/${product.databaseId}`),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const kit of kits) {
    if (kit.href?.startsWith("/kits/")) {
      entries.push({
        url: absoluteUrl(kit.href),
        lastModified,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
