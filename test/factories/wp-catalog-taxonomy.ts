/**
 * Taxonomia e produtos reais do catálogo Papelito.
 *
 * A taxonomia própria eliminou o desalinhamento que quebrava o filtro: o slug da
 * categoria É o id da UI. O fixture mantém os ids e as contagens reais para os
 * testes rodarem sobre dados de produção, não sobre nomes convenientes.
 */

export interface PapelitoCategoryFixture {
  description: string;
  iconUrl: null;
  id: number;
  name: string;
  productCount: number;
  seoDescription: string;
  seoTitle: string;
  slug: string;
  sortOrder: number;
  subcategories: {
    facet: string;
    id: number;
    name: string;
    slug: string;
    sortOrder: number;
  }[];
}

/** As 4 categorias da Papelito, com a contagem real de publicados. */
export const PAPELITO_CATEGORIES: PapelitoCategoryFixture[] = [
  {
    description: "",
    iconUrl: null,
    id: 1,
    name: "Sedas",
    productCount: 20,
    seoDescription: "",
    seoTitle: "",
    slug: "sedas",
    sortOrder: 0,
    subcategories: [
      { facet: "material", id: 11, name: "Tradicional", slug: "tradicional", sortOrder: 0 },
      { facet: "material", id: 12, name: "Brown", slug: "brown", sortOrder: 1 },
      { facet: "formato", id: 13, name: "Slim", slug: "slim", sortOrder: 2 },
      { facet: "formato", id: 14, name: "King Size", slug: "king-size", sortOrder: 3 },
    ],
  },
  {
    description: "",
    iconUrl: null,
    id: 2,
    name: "Piteiras",
    productCount: 6,
    seoDescription: "",
    seoTitle: "",
    slug: "piteiras",
    sortOrder: 1,
    subcategories: [
      { facet: "tamanho", id: 21, name: "Slim", slug: "slim", sortOrder: 0 },
      { facet: "tamanho", id: 22, name: "Mega Longa", slug: "mega-longa", sortOrder: 1 },
    ],
  },
  {
    description: "",
    iconUrl: null,
    id: 3,
    name: "Filtros",
    productCount: 8,
    seoDescription: "",
    seoTitle: "",
    slug: "filtros",
    sortOrder: 2,
    subcategories: [
      { facet: "tipo", id: 31, name: "Bio", slug: "bio", sortOrder: 0 },
    ],
  },
  {
    description: "",
    iconUrl: null,
    id: 4,
    name: "Acessórios",
    productCount: 6,
    seoDescription: "",
    seoTitle: "",
    slug: "acessorios",
    sortOrder: 3,
    subcategories: [
      { facet: "tipo", id: 41, name: "Dichavador", slug: "dichavador", sortOrder: 0 },
    ],
  },
];

export function buildPapelitoTaxonomyResponse(categories = PAPELITO_CATEGORIES) {
  return { categories, version: 1 };
}

export interface WpCategoryFixture {
  databaseId: number;
  name: string;
  slug: string;
  count: number;
  parentDatabaseId: number | null;
}

export const WP_PRODUCT_CATEGORIES: WpCategoryFixture[] = [
  { databaseId: 153, name: "Papel", slug: "papel", count: 20, parentDatabaseId: null },
  { databaseId: 154, name: "Piteiras", slug: "piteiras", count: 6, parentDatabaseId: null },
  { databaseId: 155, name: "Filtro", slug: "filtro", count: 8, parentDatabaseId: null },
  { databaseId: 156, name: "Acessórios", slug: "acessorios", count: 6, parentDatabaseId: null },
  { databaseId: 157, name: "Tradicional", slug: "tradicional", count: 4, parentDatabaseId: 153 },
  { databaseId: 158, name: "Brown", slug: "brown", count: 4, parentDatabaseId: 153 },
  { databaseId: 159, name: "Slim", slug: "slim", count: 4, parentDatabaseId: 153 },
  { databaseId: 160, name: "Hemp", slug: "hemp", count: 2, parentDatabaseId: 153 },
  { databaseId: 161, name: "Brown Slim", slug: "brown-slim", count: 2, parentDatabaseId: 153 },
  { databaseId: 162, name: "Premium", slug: "premium", count: 4, parentDatabaseId: 153 },
  {
    databaseId: 163,
    name: "Tradicional",
    slug: "tradicional-piteiras",
    count: 1,
    parentDatabaseId: 154,
  },
  { databaseId: 164, name: "Slim", slug: "slim-piteiras", count: 1, parentDatabaseId: 154 },
  { databaseId: 165, name: "Large", slug: "large", count: 1, parentDatabaseId: 154 },
  { databaseId: 166, name: "Longas", slug: "longas", count: 3, parentDatabaseId: 154 },
  {
    databaseId: 167,
    name: "Tradicional",
    slug: "tradicional-filtros",
    count: 1,
    parentDatabaseId: 155,
  },
  { databaseId: 168, name: "Longo", slug: "longo", count: 1, parentDatabaseId: 155 },
  { databaseId: 169, name: "Ultra Longo", slug: "ultra-longo", count: 1, parentDatabaseId: 155 },
  { databaseId: 170, name: "Slim", slug: "slim-filtros", count: 1, parentDatabaseId: 155 },
  { databaseId: 171, name: "Slim Longo", slug: "slim-longo", count: 1, parentDatabaseId: 155 },
  { databaseId: 172, name: "Mentol", slug: "mentol", count: 1, parentDatabaseId: 155 },
  { databaseId: 173, name: "Bio", slug: "bio", count: 1, parentDatabaseId: 155 },
  { databaseId: 174, name: "Bio Longo", slug: "bio-longo", count: 1, parentDatabaseId: 155 },
  { databaseId: 176, name: "Dichavador", slug: "dichavador", count: 4, parentDatabaseId: 156 },
  { databaseId: 191, name: "Tubelito", slug: "tubelito", count: 2, parentDatabaseId: 156 },
];

export function buildCategoriesResponse(categories = WP_PRODUCT_CATEGORIES) {
  return {
    productCategories: {
      nodes: categories.map((category) => ({
        id: `cat:${category.databaseId}`,
        databaseId: category.databaseId,
        name: category.name,
        slug: category.slug,
        count: category.count,
        parentDatabaseId: category.parentDatabaseId,
      })),
    },
  };
}

interface ProductFixtureInput {
  databaseId: number;
  name: string;
  categorySlugs: string[];
  price?: string;
  collections?: string[];
}

export function buildProductNode({
  databaseId,
  name,
  categorySlugs,
  collections = [],
  price = "R$ 90,00",
}: ProductFixtureInput) {
  return {
    __typename: "SimpleProduct",
    id: `product:${databaseId}`,
    databaseId,
    name,
    slug: name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-"),
    image: { sourceUrl: `https://cdn.papelito.test/${databaseId}.jpg`, altText: name },
    // O primeiro slug é a CATEGORIA PRINCIPAL; os demais são subcategorias. É a
    // cardinalidade real: exatamente uma categoria, N subcategorias.
    papelitoCategory: (() => {
      const category = PAPELITO_CATEGORIES.find((entry) => entry.slug === categorySlugs[0]);

      return category
        ? { databaseId: category.id, name: category.name, slug: category.slug }
        : null;
    })(),
    papelitoSubcategories: categorySlugs.slice(1).map((slug) => {
      const parent = PAPELITO_CATEGORIES.find((entry) => entry.slug === categorySlugs[0]);
      const sub = parent?.subcategories.find((entry) => entry.slug === slug);

      return {
        databaseId: sub?.id ?? 0,
        facet: sub?.facet ?? "geral",
        name: sub?.name ?? slug,
        slug,
      };
    }),
    papelitoCollections: collections,
    price,
    regularPrice: price,
    salePrice: null,
    weight: "0.4",
    length: "16",
    width: "11",
    height: "3",
  };
}

/**
 * Produtos reais do catálogo: 20 sedas (raiz `papel`), 6 piteiras, 8 filtros e
 * 6 acessórios — a mesma distribuição da base de produção.
 */
export const WP_PRODUCTS = [
  ...[
    "Seda Tradicional Mini Size",
    "Seda Tradicional Longa",
    "Seda Tradicional King Size",
    "Seda Tradicional Com Piteira",
  ].map((name, index) =>
    buildProductNode({ databaseId: 11760 + index, name, categorySlugs: ["sedas", "tradicional"] }),
  ),
  ...["Seda Slim Mini Size", "Seda Slim Longa", "Seda Slim King Size", "Seda Slim Com Piteira"].map(
    (name, index) =>
      buildProductNode({ databaseId: 11776 + index, name, categorySlugs: ["sedas", "slim"] }),
  ),
  ...[
    "Seda Pink King Size",
    "Seda Insane King Size",
    "Seda Insane Brown King Size",
    "Seda Alfafa King Size",
  ].map((name, index) =>
    buildProductNode({ databaseId: 11792 + index, name, categorySlugs: ["sedas"], collections: ["premium"] }),
  ),
  ...["Seda Hemp Mini Size", "Seda Hemp King Size"].map((name, index) =>
    buildProductNode({ databaseId: 11784 + index, name, categorySlugs: ["sedas"] }),
  ),
  ...["Seda Brown Slim Mini Size", "Seda Brown Slim King Size"].map((name, index) =>
    buildProductNode({ databaseId: 11788 + index, name, categorySlugs: ["sedas", "brown", "slim"] }),
  ),
  ...[
    "Seda brown Mini Size",
    "Seda brown Longa",
    "Seda Brown King Size",
    "Seda brown Com Piteira",
  ].map((name, index) =>
    buildProductNode({ databaseId: 11768 + index, name, categorySlugs: ["sedas", "brown"] }),
  ),
  ...["Piteira Ultra Longa", "Piteira Mega Longa", "Piteira Longa"].map((name, index) =>
    buildProductNode({ databaseId: 11806 + index, name, categorySlugs: ["piteiras", "mega-longa"] }),
  ),
  buildProductNode({
    databaseId: 11800,
    name: "Piteira Tradicional",
    categorySlugs: ["piteiras"],
  }),
  buildProductNode({
    databaseId: 11802,
    name: "Piteira Slim",
    categorySlugs: ["piteiras", "slim"],
  }),
  buildProductNode({
    databaseId: 11804,
    name: "Piteira Large",
    categorySlugs: ["piteiras"],
  }),
  ...[
    ["Filtro Ultra Longo", "ultra-longo"],
    ["Filtro Tradicional", "tradicional-filtros"],
    ["Filtro Slim Longo", "slim-longo"],
    ["Filtro Slim", "slim-filtros"],
    ["Filtro Mentol", "mentol"],
    ["Filtro Longo", "longo"],
    ["Filtro Bio Longo", "bio-longo"],
    ["Filtro Bio", "bio"],
  ].map(([name, subcategory], index) =>
    buildProductNode({
      databaseId: 11812 + index,
      name,
      categorySlugs: ["filtros", subcategory],
    }),
  ),
  ...["Dichavador Tradicional", "Dichavador Neon", "Dichavador Cores", "Dichavador Brilho"].map(
    (name, index) =>
      buildProductNode({
        databaseId: 11838 + index,
        name,
        categorySlugs: ["acessorios", "dichavador"],
      }),
  ),
  ...["Tubelito Tradicional", "Tubelito Neon"].map((name, index) =>
    buildProductNode({
      databaseId: 11853 + index,
      name,
      categorySlugs: ["acessorios", "tubelito"],
    }),
  ),
];

/**
 * A query não filtra mais por categoria no WordPress.
 *
 * Sem `product_cat`, o catálogo varre e filtra em memória pela categoria
 * Papelito — o mesmo caminho que já era a segunda barreira do pipeline.
 */
export function buildProductsResponse() {
  return { products: { nodes: WP_PRODUCTS } };
}
