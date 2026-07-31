/**
 * Taxonomia e produtos reais do catálogo Papelito, capturados do WPGraphQL.
 *
 * A raiz das sedas chama "Papel" e a dos filtros "Filtro" — nenhum termo casa com os ids
 * da UI (`sedas`/`filtros`). É exatamente esse desalinhamento que quebrou o filtro, então
 * os testes precisam rodar sobre os dados reais, não sobre nomes convenientes.
 */

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
}

export function buildProductNode({
  databaseId,
  name,
  categorySlugs,
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
    productCategories: {
      nodes: categorySlugs.map((slug) => {
        const category = WP_PRODUCT_CATEGORIES.find((entry) => entry.slug === slug);

        return {
          id: `cat:${slug}`,
          databaseId: category?.databaseId ?? 0,
          name: category?.name ?? slug,
          slug,
          count: category?.count ?? 0,
          parentDatabaseId: category?.parentDatabaseId ?? null,
        };
      }),
    },
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
    buildProductNode({ databaseId: 11760 + index, name, categorySlugs: ["papel", "tradicional"] }),
  ),
  ...["Seda Slim Mini Size", "Seda Slim Longa", "Seda Slim King Size", "Seda Slim Com Piteira"].map(
    (name, index) =>
      buildProductNode({ databaseId: 11776 + index, name, categorySlugs: ["papel", "slim"] }),
  ),
  ...[
    "Seda Pink King Size",
    "Seda Insane King Size",
    "Seda Insane Brown King Size",
    "Seda Alfafa King Size",
  ].map((name, index) =>
    buildProductNode({ databaseId: 11792 + index, name, categorySlugs: ["papel", "premium"] }),
  ),
  ...["Seda Hemp Mini Size", "Seda Hemp King Size"].map((name, index) =>
    buildProductNode({ databaseId: 11784 + index, name, categorySlugs: ["hemp", "papel"] }),
  ),
  ...["Seda Brown Slim Mini Size", "Seda Brown Slim King Size"].map((name, index) =>
    buildProductNode({ databaseId: 11788 + index, name, categorySlugs: ["brown-slim", "papel"] }),
  ),
  ...[
    "Seda brown Mini Size",
    "Seda brown Longa",
    "Seda Brown King Size",
    "Seda brown Com Piteira",
  ].map((name, index) =>
    buildProductNode({ databaseId: 11768 + index, name, categorySlugs: ["brown", "papel"] }),
  ),
  ...["Piteira Ultra Longa", "Piteira Mega Longa", "Piteira Longa"].map((name, index) =>
    buildProductNode({ databaseId: 11806 + index, name, categorySlugs: ["longas", "piteiras"] }),
  ),
  buildProductNode({
    databaseId: 11800,
    name: "Piteira Tradicional",
    categorySlugs: ["piteiras", "tradicional-piteiras"],
  }),
  buildProductNode({
    databaseId: 11802,
    name: "Piteira Slim",
    categorySlugs: ["piteiras", "slim-piteiras"],
  }),
  buildProductNode({
    databaseId: 11804,
    name: "Piteira Large",
    categorySlugs: ["large", "piteiras"],
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
      categorySlugs: ["filtro", subcategory],
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

export function buildProductsResponse(categoryIn?: string[]) {
  const nodes = categoryIn?.length
    ? WP_PRODUCTS.filter((product) =>
        product.productCategories.nodes.some((category) => categoryIn.includes(category.slug)),
      )
    : WP_PRODUCTS;

  return { products: { nodes } };
}
